# Version 2 UI integration

Source: Game UI, Figma file 21DQmYBRyZo7SsQ5izSss5.

- Screens 01–08 informed the pause/mode panel, tutorial, live pole prompts, completed-move awards, and expanded controls. The captions and flow arrows are design documentation, not game UI.
- The 1440 × 1080 reference coordinates scale over the live 3D canvas. Source SVG dimensions remain intact. Koulen and the SVG panels/icons are stored locally under public/assets/ui.
- The user confirmed that the tips badge is the running total including combo earnings. Existing scoring remains; popups use the actual completed-move delta. Two consecutive floor dances were verified at +30 / total 30 and +60 / total 90.
- Demo accounting is separate from the real run. Pause and safety warnings freeze reward presentation. Completion IDs prevent duplicate popup reception; presentation never changes the score.
- Off-Peak and Rush Hour select the next mode. Resume starts the selected timed mode at entry/results; Endless Practice starts it without a timer. Within the same paused mode Resume preserves the run. Changing mode starts a fresh run.
- Backslash hides/shows help; persistent HUD and reward feedback stay visible. Controls + expands pause help. Expanded gameplay help matches frame 1:319; additional session settings remain available in expanded pause controls.
- Browser verified local asset loading, tutorial, help disclosure, reward totals, pause/resume, mode switching, and End Session. Automated tests cover presentation deduplication/freeze/queueing and completion score records, alongside the gameplay suite.
