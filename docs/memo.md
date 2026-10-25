```sh
ln -sf AGENTS.md CLAUDE.md
mkdir .claude && ln -sf ../.agents/skills .claude/skills
pnpm run secret:setup
 ```