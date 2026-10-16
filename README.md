# 4I System Taxonomy Manager for Obsidian

A rigid, highly automated knowledge management plugin designed to enforce the **4I System Taxonomy**. It automatically routes files into folders, injects hierarchical tags, builds bidirectional parent-child navigation, and provides a dynamic "Deck" sidebar for daily journals and active projects.

## Core Features

- **Automated Folder Routing:** Never manually drag a file into a folder again. The plugin reads your file's alphanumeric prefix and automatically creates the correct folder structure and moves the file into it.
- **Dynamic Parent-Child Linking:** Automatically injects a navigation block at the top of your notes, linking to the immediate Parent note and listing all immediate Branch notes.
- **Auto-Tagging:** Reads the taxonomy tree and automatically injects exact hierarchical CSS classes (`scope`, `unit`, `sub`, `topic`) and tags directly into your Obsidian properties.
- **The 4I Deck Sidebar:** A custom, dynamic sidebar that generates Daily Journals (Diet, Workout, Reflective, Gratitude, Mental Reflection) based on the current date, and automatically aggregates notes tagged with `#reading` and `#work`.

## The Naming Convention (Required)

This plugin **strictly requires** a specific naming convention to function. If you do not format your file names correctly, the automation will safely ignore them.

Every file must be named using the `[Alphanumeric ID] ; [Title]` format. Note the space, semicolon, space (` ; `).

**Taxonomy Levels:**
1. **Scope:** `00 ; Master Scope`
2. **Unit:** `00a ; First Unit`
3. **Sub-unit:** `00a1 ; First Sub-unit`
4. **Topic:** `00a1a ; First Topic`
5. **Instance:** `00a1a1 ; First Instance`

*Example:* If you create a file named `02c1a1 ; 16102026 Gratitude Journal`, the plugin will automatically look for its parent (`02c1a`), create the necessary folders, move the file, tag it with `#02c1a-gratitude`, and link them together.

## The 4I Deck (Sidebar)

Click the **Layers** icon in your left ribbon, or use the command palette (`4I: Open Deck Sidebar`) to open your command center.

1. **Core Utilities:** Permanent links to your `Index`, `Scratchpad (02b2)`, and `The Bank (00a1)`.
2. **Daily Journals:** Automatically checks the current date. If you haven't created your logs for the day (e.g., Workout Log, Diet Log), it presents a "➕ Create" button. Clicking it calculates the next available ID in your current month's folder, creates the note, and opens it.
3. **Active Projects:** Automatically lists any note in your vault tagged with `#reading` or `#work`.

## Installation

### Manual Installation
1. Download the `main.js` and `manifest.json` files from the latest [GitHub Release](../../releases).
2. Create a folder named `4i-system-manager` inside your vault's `.obsidian/plugins/` directory.
3. Place both files inside that folder.
4. Reload Obsidian and enable the plugin in **Settings > Community Plugins**.

## Disclaimer
This plugin is highly opinionated and designed specifically for the 4I workflow. When active, it *will* automatically move files that match its regex pattern. It is highly recommended to test this on a backup vault first to understand its routing mechanics.
