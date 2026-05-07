import subprocess

msg = (
    "feat: v6.0.0 Aichi Gold Standard -- branded PDF + Linear simulator + field mode\n"
    "\n"
    "Transforms the platform into a daily tool for Aichi real estate agents.\n"
    "\n"
    "Features:\n"
    "- Branded PDF: companyName, agentName, disclaimer, footerContact,\n"
    "  includeTransactionComparables, includeLinearImpact (all via generate_area_report)\n"
    "- Redesigned pdf.ts: header color band, section styles, comparables table, disclaimer\n"
    "- simulate_aichi_future tool: Linear Chuo Shinkansen (+28-35% Nagoya),\n"
    "  Centrair 2nd runway (+18%), Toyota EV investment (+16%), Expo legacy, highways\n"
    "- Field/Presentation Mode (?mode=field): large-font tablet UI, QR code share button,\n"
    "  field toolbar, mode toggle in header, deep-link URL with area param\n"
    "- data/aichi/future_infrastructure.json: 5 major Aichi infrastructure projects\n"
    "- data/aichi/neighborhoods.json: 10 hyper-local cho-me profiles\n"
    "- Aichi transactions.csv expanded to ~170 rows (Fushimi, Osu, Yagoto, Tokoname etc)\n"
    "- docs/aichi-agent-guide.md: complete workflow guide for Aichi brokers\n"
    "- docs/prefecture-completion-kit.md: Bronze/Silver/Gold framework + rollout plan\n"
    "- scripts/prefecture-setup.py: auto-generates 14 stub data files for new prefectures\n"
    "- config/aichi-branding.example.json: sample branding config\n"
    "\n"
    "All 421 tests pass. Version: 5.2.0 -> 6.0.0\n"
)

subprocess.run(['git', 'add', '-A'], check=True)
subprocess.run(['git', 'commit', '-m', msg], check=True)
print('Committed v6.0.0')
