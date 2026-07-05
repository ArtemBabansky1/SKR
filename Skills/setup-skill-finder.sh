#!/usr/bin/env bash
#
# setup-skill-finder.sh
# Ставит skill-finder (github.com/aktsmm/Agent-Skills) в ТЕКУЩИЙ проект,
# в папку .claude/skills/ — не на машину.
#
# Использование:
#   1) Положи файл в корень проекта
#   2) chmod +x setup-skill-finder.sh
#   3) ./setup-skill-finder.sh
#
# Дальше ставить другие скиллы в проект:
#   ./setup-skill-finder.sh --find "запрос"        # искать скилл
#   ./setup-skill-finder.sh --get ИМЯ_СКИЛЛА       # поставить скилл В ПРОЕКТ
#   ./setup-skill-finder.sh --anthropic            # поставить 7 офиц. скиллов Anthropic

set -euo pipefail

REPO="https://github.com/aktsmm/Agent-Skills.git"
ANTHROPIC_REPO_TARBALL="https://codeload.github.com/anthropics/skills/tar.gz/refs/heads/main"
SKILLS_DIR=".claude/skills"
FINDER="$SKILLS_DIR/skill-finder"
SCRIPT="$FINDER/scripts/search_skills.py"

# Временная папка (глобальная) + единый обработчик очистки.
# Инициализируем пустой, чтобы set -u не ругался в trap.
TMPDIR_CLEAN=""
cleanup() { [ -n "$TMPDIR_CLEAN" ] && rm -rf "$TMPDIR_CLEAN"; return 0; }
trap cleanup EXIT

# 7 официальных скиллов Anthropic, совпадающих со списком из постов
ANTHROPIC_SKILLS=(
  frontend-design
  canvas-design
  algorithmic-art
  brand-guidelines
  theme-factory
  mcp-builder
  skill-creator
)

# --- цвета для сообщений ---
info()  { printf '\033[36m▸ %s\033[0m\n' "$1"; }
ok()    { printf '\033[32m✓ %s\033[0m\n' "$1"; }
warn()  { printf '\033[33m⚠ %s\033[0m\n' "$1"; }
die()   { printf '\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

# --- проверка зависимостей ---
check_deps() {
  local missing=()
  command -v git    >/dev/null 2>&1 || missing+=("git")
  command -v python3 >/dev/null 2>&1 || missing+=("python3")
  command -v curl   >/dev/null 2>&1 || missing+=("curl")
  command -v gh     >/dev/null 2>&1 || missing+=("gh (GitHub CLI)")

  if [ ${#missing[@]} -gt 0 ]; then
    warn "Не хватает: ${missing[*]}"
    echo "  gh нужен только для установки ДРУГИХ скиллов через finder."
    echo "  Установка самого finder сработает и без gh."
    echo
    if printf '%s\n' "${missing[@]}" | grep -qvE 'gh'; then
      die "Без git/python3/curl продолжить нельзя. Поставь их и запусти снова."
    fi
  fi

  # Проверка авторизации gh (не блокирующая)
  if command -v gh >/dev/null 2>&1; then
    if ! gh auth status >/dev/null 2>&1; then
      warn "gh установлен, но не авторизован. Для установки скиллов сделай: gh auth login"
    fi
  fi
}

# --- установка самого skill-finder в проект ---
install_finder() {
  info "Ставлю skill-finder в проект: $FINDER"
  mkdir -p "$SKILLS_DIR"

  if [ -d "$FINDER" ]; then
    warn "skill-finder уже установлен в этом проекте. Обновляю."
    rm -rf "$FINDER"
  fi

  TMPDIR_CLEAN="$(mktemp -d)"

  info "Клонирую репозиторий (только последний коммит)…"
  git clone --depth 1 "$REPO" "$TMPDIR_CLEAN/agent-skills" >/dev/null 2>&1 \
    || die "Не удалось клонировать $REPO"

  [ -d "$TMPDIR_CLEAN/agent-skills/skill-finder" ] \
    || die "В репозитории нет папки skill-finder — структура изменилась?"

  cp -r "$TMPDIR_CLEAN/agent-skills/skill-finder" "$SKILLS_DIR/"
  ok "skill-finder установлен в $FINDER"

  # Явная очистка temp
  rm -rf "$TMPDIR_CLEAN"
  TMPDIR_CLEAN=""

  # gitignore-подсказка
  if [ -d .git ] && ! grep -q "^\.skills" .gitignore 2>/dev/null; then
    info "Совет: скиллы поедут в git вместе с проектом (это и есть цель)."
  fi
}

# --- поиск скилла через finder ---
find_skill() {
  [ -f "$SCRIPT" ] || die "Сначала запусти скрипт без аргументов, чтобы поставить finder."
  python3 "$SCRIPT" "$1"
}

# --- установка другого скилла В ПРОЕКТ (ключевой момент: --install-dir) ---
get_skill() {
  [ -f "$SCRIPT" ] || die "Сначала запусти скрипт без аргументов, чтобы поставить finder."
  info "Ставлю скилл '$1' в проект ($SKILLS_DIR)…"
  python3 "$SCRIPT" --install "$1" --install-dir "$SKILLS_DIR" --no-interactive
  ok "Готово. Проверь: $SKILLS_DIR/$1/SKILL.md"
  warn "Перед использованием загляни в его SKILL.md — это чужой код."
}

# --- установка 7 официальных скиллов Anthropic в проект ---
# Качает архивом (без gh/авторизации), кладёт целиком со скриптами и ресурсами.
install_anthropic() {
  command -v curl >/dev/null 2>&1 || die "Нужен curl."
  command -v tar  >/dev/null 2>&1 || die "Нужен tar."

  info "Ставлю официальные скиллы Anthropic в проект ($SKILLS_DIR)…"
  mkdir -p "$SKILLS_DIR"

  TMPDIR_CLEAN="$(mktemp -d)"

  info "Скачиваю репозиторий anthropics/skills…"
  curl -sL "$ANTHROPIC_REPO_TARBALL" -o "$TMPDIR_CLEAN/anthropic.tar.gz" \
    || die "Не удалось скачать архив anthropics/skills"

  tar -xzf "$TMPDIR_CLEAN/anthropic.tar.gz" -C "$TMPDIR_CLEAN" \
    || die "Не удалось распаковать архив"

  # Папка внутри архива называется skills-main
  local src="$TMPDIR_CLEAN/skills-main/skills"
  [ -d "$src" ] || die "Структура архива изменилась — нет $src"

  local installed=0 skipped=0
  for name in "${ANTHROPIC_SKILLS[@]}"; do
    if [ -d "$src/$name" ]; then
      rm -rf "${SKILLS_DIR:?}/$name"          # переустановка, если был
      cp -r "$src/$name" "$SKILLS_DIR/"
      printf '   \033[32m✓\033[0m %s\n' "$name"
      installed=$((installed + 1))
    else
      printf '   \033[33m⚠\033[0m %s — нет в репозитории (пропущен)\n' "$name"
      skipped=$((skipped + 1))
    fi
  done

  ok "Установлено: $installed, пропущено: $skipped → $SKILLS_DIR/"

  # Явная очистка temp (trap на EXIT — подстраховка)
  rm -rf "$TMPDIR_CLEAN"
  TMPDIR_CLEAN=""
}

# =============================================================================
# main
# =============================================================================
case "${1:-}" in
  --find)
    [ $# -ge 2 ] || die "Использование: $0 --find \"запрос\""
    check_deps
    find_skill "$2"
    ;;
  --get)
    [ $# -ge 2 ] || die "Использование: $0 --get ИМЯ_СКИЛЛА"
    check_deps
    get_skill "$2"
    ;;
  --anthropic)
    install_anthropic
    ;;
  --help|-h)
    sed -n '3,21p' "$0" | sed 's/^# \{0,1\}//'
    ;;
  "")
    # без аргументов — первичная установка finder
    check_deps
    install_finder
    echo
    ok "Всё готово!"
    echo
    echo "Дальше:"
    echo "  Искать скилл:        $0 --find \"pdf\""
    echo "  Поставить в проект:  $0 --get ИМЯ_СКИЛЛА"
    echo "  7 скиллов Anthropic: $0 --anthropic"
    echo
    echo "Или напрямую (то же самое):"
    echo "  python3 $SCRIPT \"запрос\""
    echo "  python3 $SCRIPT --install ИМЯ --install-dir $SKILLS_DIR --no-interactive"
    ;;
  *)
    die "Неизвестный аргумент: $1  (см. $0 --help)"
    ;;
esac
