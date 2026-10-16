'use strict';

var obsidian = require('obsidian');

const VIEW_TYPE_4I_DECK = "4i-deck-view";

class FourIDeckView extends obsidian.ItemView {
    constructor(leaf) {
        super(leaf);
    }
    getViewType() {
        return VIEW_TYPE_4I_DECK;
    }
    getDisplayText() {
        return "4I Deck";
    }
    getIcon() {
        return "layers";
    }
    async onOpen() {
        this.renderDeck();
        this.registerEvent(this.app.metadataCache.on('changed', () => this.renderDeck()));
        this.registerEvent(this.app.metadataCache.on('resolved', () => this.renderDeck()));
        this.registerEvent(this.app.vault.on('delete', () => this.renderDeck()));
        this.registerEvent(this.app.vault.on('rename', () => this.renderDeck()));
    }
    renderDeck() {
        const container = this.contentEl;
        container.empty();
        
        container.createEl("h3", { text: "4I System Deck" });
        const allFiles = this.app.vault.getMarkdownFiles();
        
        // 1. CORE UTILITIES
        container.createEl("h5", { text: "Core Utilities" });
        const coreList = container.createEl("div");
        this.createNavButton(coreList, "Root Index", "Index.md");
        
        const scratchpadFile = allFiles.find(f => f.basename.includes("Scratchpad") || f.basename.includes("02b2"));
        this.createNavButton(coreList, "Scratchpad", scratchpadFile ? scratchpadFile.path : "");
        this.createNavButton(coreList, "The Bank", "00a1 ; The Bank (Investment).md");

        container.createEl("hr");

        // 2. JOURNALS
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const todayStr = `${dd}${mm}${yyyy}`;
        
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonthStr = `${months[now.getMonth()]} ${now.getFullYear()}`;

        container.createEl("h5", { text: "Daily Journals" });
        const journalList = container.createEl("div");

        const journals = [
            { rootId: "02a1", keyword: "Diet Log" },
            { rootId: "02a2", keyword: "Workout Log" },
            { rootId: "02b1", keyword: "Reflective Journal" },
            { rootId: "02c1", keyword: "Gratitude Journal" },
            { rootId: "02c2", keyword: "Mental Reflection" }
        ];

        journals.forEach(journal => {
            const existingLog = allFiles.find(f => f.basename.includes(todayStr) && f.basename.includes(journal.keyword));
            if (existingLog) {
                this.createNavButton(journalList, `📝 ${existingLog.basename}`, existingLog.path, true);
            } else {
                const createBtn = this.createNavButton(journalList, `➕ Create ${journal.keyword}`, "", false, true);
                createBtn.onclick = async () => {
                    await this.createNewDailyLog(journal.rootId, journal.keyword, currentMonthStr, todayStr, allFiles);
                };
            }
        });

        container.createEl("hr");

        // 3. CURRENTLY READING
        container.createEl("h5", { text: "Currently Reading" });
        const readingList = container.createEl("div");
        const readingFiles = this.getFilesWithTag("#reading", allFiles);
        if (readingFiles.length > 0) {
            readingFiles.forEach(f => this.createNavButton(readingList, f.basename, f.path));
        } else {
            const emptyState = readingList.createEl("div", { text: "Tag notes with #reading" });
            emptyState.style.opacity = "0.5";
            emptyState.style.fontSize = "12px";
        }

        container.createEl("hr");

        // 4. WORK
        container.createEl("h5", { text: "Work" });
        const workList = container.createEl("div");
        const workFiles = this.getFilesWithTag("#work", allFiles);
        if (workFiles.length > 0) {
            workFiles.forEach(f => this.createNavButton(workList, f.basename, f.path));
        } else {
            const emptyState = workList.createEl("div", { text: "Tag notes with #work" });
            emptyState.style.opacity = "0.5";
            emptyState.style.fontSize = "12px";
        }
    }

    async createNewDailyLog(rootId, keyword, monthStr, todayStr, allFiles) {
        const parentNote = allFiles.find(f => f.basename.startsWith(rootId) && f.basename.includes(monthStr));
        if (!parentNote) {
            new obsidian.Notice(`Missing Parent: Create the '${monthStr}' note under ${rootId} first.`);
            return;
        }

        const parentIdMatch = parentNote.basename.match(/^([0-9]{2}[a-z]*[0-9]*[a-z]*[0-9]*)\s*;/i);
        if (!parentIdMatch) return;
        const parentId = parentIdMatch[1];

        const children = allFiles.filter(f => {
            const m = f.basename.match(/^([0-9]{2}[a-z]*[0-9]*[a-z]*[0-9]*)\s*;/i);
            return m && m[1].startsWith(parentId) && m[1].length > parentId.length;
        });

        let maxSuffix = 0;
        children.forEach(c => {
            const m = c.basename.match(/^([0-9]{2}[a-z]*[0-9]*[a-z]*[0-9]*)\s*;/i);
            if(m) {
                const suffixStr = m[1].replace(parentId, '');
                const suffixNum = parseInt(suffixStr);
                if(!isNaN(suffixNum) && suffixNum > maxSuffix) maxSuffix = suffixNum;
            }
        });

        const newId = `${parentId}${maxSuffix + 1}`;
        const newFileName = `${newId} ; ${todayStr} ${keyword}.md`;
        const folderPath = parentNote.parent && parentNote.parent.path !== "/" ? parentNote.parent.path : "";
        const fullPath = folderPath === "" ? newFileName : `${folderPath}/${newFileName}`;

        const newFile = await this.app.vault.create(obsidian.normalizePath(fullPath), `# ${keyword}\n\n`);
        this.app.workspace.openLinkText(newFile.path, "", false);
        this.renderDeck(); 
    }

    getFilesWithTag(tag, allFiles) {
        return allFiles.filter(f => {
            const cache = this.app.metadataCache.getFileCache(f);
            if (!cache) return false;
            
            const tags = obsidian.getAllTags(cache) || [];
            return tags.some(t => t.toLowerCase() === tag.toLowerCase() || t.toLowerCase() === tag.toLowerCase().replace('#', ''));
        });
    }

    createNavButton(parent, title, path, isActive = false, isCreateAction = false) {
        const btn = parent.createEl("div", { text: title });
        btn.style.cursor = "pointer";
        btn.style.padding = "6px 10px";
        btn.style.marginBottom = "6px";
        btn.style.borderRadius = "5px";
        btn.style.fontSize = "13px";
        btn.style.transition = "background-color 0.1s";
        btn.style.overflow = "hidden";
        btn.style.textOverflow = "ellipsis";
        btn.style.whiteSpace = "nowrap";

        if (isActive) {
            btn.style.backgroundColor = "var(--interactive-accent)";
            btn.style.color = "var(--text-on-accent)";
            btn.style.fontWeight = "bold";
        } else if (isCreateAction) {
            btn.style.backgroundColor = "transparent";
            btn.style.border = "1px dashed var(--text-muted)";
            btn.style.color = "var(--text-muted)";
        } else {
            btn.style.backgroundColor = "var(--background-secondary-alt)";
            btn.style.border = "1px solid var(--background-modifier-border)";
        }

        btn.addEventListener("mouseover", () => {
            if (!isActive && !isCreateAction) btn.style.backgroundColor = "var(--interactive-hover)";
            if (isCreateAction) {
                btn.style.borderColor = "var(--text-normal)";
                btn.style.color = "var(--text-normal)";
            }
        });
        
        btn.addEventListener("mouseout", () => {
            if (!isActive && !isCreateAction) btn.style.backgroundColor = "var(--background-secondary-alt)";
            if (isCreateAction) {
                btn.style.borderColor = "var(--text-muted)";
                btn.style.color = "var(--text-muted)";
            }
        });

        if (path) {
            btn.onclick = (e) => {
                e.preventDefault();
                this.app.workspace.openLinkText(path, "", false);
            };
        }
        return btn;
    }
}

class FourISystemPlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.isSyncing = false;
        this.initialLoadComplete = false;
    }

    async onload() {
        console.log("Loading 4I System Taxonomy Manager");

        this.registerView(
            VIEW_TYPE_4I_DECK,
            (leaf) => new FourIDeckView(leaf)
        );

        this.addCommand({
            id: 'sync-4i-taxonomy',
            name: 'Sync 4I Taxonomy (Update Properties and Links)',
            callback: () => this.syncAllNotes(),
        });

        this.addCommand({
            id: 'open-4i-deck',
            name: '4I: Open Deck Sidebar',
            callback: () => this.activateDeckView(),
        });

        this.addRibbonIcon('layers', 'Open 4I Deck', () => {
            this.activateDeckView();
        });

        this.app.workspace.onLayoutReady(() => {
            setTimeout(() => {
                this.initialLoadComplete = true;
            }, 5000);
        });

        this.registerEvent(
            this.app.vault.on('create', (file) => {
                if (file instanceof obsidian.TFile && file.extension === 'md') {
                    this.processNote(file);
                }
            })
        );
        
        this.registerEvent(
            this.app.vault.on('rename', (file) => {
                if (file instanceof obsidian.TFile && file.extension === 'md') {
                    this.syncAllNotes(); 
                }
            })
        );
    }

    async activateDeckView() {
        const { workspace } = this.app;
        let leaf = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_4I_DECK);

        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) {
                await rightLeaf.setViewState({ type: VIEW_TYPE_4I_DECK, active: true });
                leaf = workspace.getLeavesOfType(VIEW_TYPE_4I_DECK)[0];
            }
        }
        if (leaf) workspace.revealLeaf(leaf);
    }

    async syncAllNotes() {
        if (this.isSyncing) return;
        this.isSyncing = true;
        try {
            const files = this.app.vault.getMarkdownFiles();
            let processed = 0;
            for (const file of files) {
                if (this.isTaxonomyNote(file.basename)) {
                    try {
                        await this.processNote(file, true);
                        processed++;
                    } catch (error) {
                        console.error(`4I System: Failed processing ${file.basename}`, error);
                    }
                }
            }
            new obsidian.Notice(`4I System Sync Complete. Updated ${processed} notes.`);
        } finally {
            this.isSyncing = false;
        }
    }

    getTaxonomyLevel(id) {
        const match = id.match(/^(\d{2})([a-z]*)([\d]*)([a-z]*)([\d]*)$/i);
        if (!match) return 0;
        if (match[5]) return 6; 
        if (match[4]) return 5; 
        if (match[3]) return 4; 
        if (match[2]) return 3; 
        return 2; 
    }

    getParentId(id) {
        const match = id.match(/^(\d{2})([a-z]*)([\d]*)([a-z]*)([\d]*)$/i);
        if (!match) return "";
        if (match[5]) return id.slice(0, id.length - match[5].length);
        if (match[4]) return id.slice(0, id.length - match[4].length);
        if (match[3]) return id.slice(0, id.length - match[3].length);
        if (match[2]) return id.slice(0, id.length - match[2].length);
        return "";
    }

    isTaxonomyNote(basename) {
        const regex = /^([0-9]{2}[a-z]*[0-9]*[a-z]*[0-9]*)\s*;\s*(.+)$/i;
        return regex.test(basename);
    }

    async processNote(file, isBulkSync = false) {
        const match = file.basename.match(/^([0-9]{2}[a-z]*[0-9]*[a-z]*[0-9]*)\s*;\s*(.+)$/i);
        if (!match) return;

        const id = match[1];
        const level = this.getTaxonomyLevel(id); 
        const allFiles = this.app.vault.getMarkdownFiles();

        let parentFile = undefined;
        if (level > 2) {
            const parentId = this.getParentId(id);
            parentFile = allFiles.find((f) => f.basename.startsWith(`${parentId} ;`));
            if (!parentFile) {
                if (!isBulkSync && this.initialLoadComplete) {
                    new obsidian.Notice(`Parent unavailable: ${file.basename}`);
                }
            }
        }

        let cssClass = "";
        if (level === 2) cssClass = "scope";
        else if (level === 3) cssClass = "unit";
        else if (level === 4) cssClass = "sub";
        else if (level === 5) cssClass = "topic"; 

        const tagsToApply = [];
        const addTagForLevel = (levelId) => {
            const targetFile = allFiles.find((f) => f.basename.startsWith(`${levelId} ;`));
            if (targetFile) {
                const targetMatch = targetFile.basename.match(/^([0-9]{2}[a-z]*[0-9]*)\s*;\s*(.+)$/i);
                if (targetMatch) {
                    const tagTitle = targetMatch[2].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    tagsToApply.push(`${levelId}-${tagTitle}`);
                }
            }
        };

        const matchParts = id.match(/^(\d{2})([a-z]*)([\d]*)([a-z]*)([\d]*)$/i);
        if (matchParts) {
            if (level >= 2) addTagForLevel(matchParts[1]); 
            if (level >= 3) addTagForLevel(matchParts[1] + matchParts[2]); 
            if (level >= 4) addTagForLevel(matchParts[1] + matchParts[2] + matchParts[3]); 
        }

        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            const existingTags = Array.isArray(frontmatter.tags) ? frontmatter.tags : (frontmatter.tags ? [frontmatter.tags] : []);
            const customTags = existingTags.filter((t) => !t.match(/^[0-9]{2}[a-z]*[0-9]*-[a-z0-9]+$/i));
            frontmatter.tags = [...new Set([...tagsToApply, ...customTags])];

            if (cssClass !== "") {
                if (!frontmatter.cssclasses) {
                    frontmatter.cssclasses = [cssClass];
                } else if (Array.isArray(frontmatter.cssclasses)) {
                    frontmatter.cssclasses = frontmatter.cssclasses.filter(
                        (c) => !["scope", "unit", "sub", "topic"].includes(c)
                    );
                    frontmatter.cssclasses.push(cssClass);
                }
            } else {
                if (Array.isArray(frontmatter.cssclasses)) {
                    frontmatter.cssclasses = frontmatter.cssclasses.filter(
                        (c) => !["scope", "unit", "sub", "topic"].includes(c)
                    );
                    if (frontmatter.cssclasses.length === 0) {
                        delete frontmatter.cssclasses;
                    }
                }
            }
        });

        await this.updateLinks(file, id, allFiles, parentFile);
        await this.organizeFile(file, id, level, parentFile);

        if (!isBulkSync && parentFile) {
            const freshFiles = this.app.vault.getMarkdownFiles();
            const parentId = this.getParentId(id);
            await this.updateLinks(parentFile, parentId, freshFiles);
        }
    }

    async updateLinks(file, id, allFiles, knownParent) {
        let parentLink = "[[Index]]";
        if (this.getTaxonomyLevel(id) > 2) {
            let actualParent = knownParent;
            if (!actualParent) {
                const parentId = this.getParentId(id);
                actualParent = allFiles.find((f) => f.basename.startsWith(`${parentId} ;`));
            }
            if (actualParent) {
                parentLink = `[[${actualParent.basename}]]`;
            } else {
                parentLink = `[[${this.getParentId(id)}]] (File missing)`;
            }
        }

        const childrenFiles = allFiles.filter((f) => {
            const match = f.basename.match(/^([0-9]{2}[a-z]*[0-9]*[a-z]*[0-9]*)\s*;\s*/i);
            if (!match) return false;
            const childId = match[1];
            return this.getParentId(childId) === id;
        });

        childrenFiles.sort((a, b) => a.basename.localeCompare(b.basename, undefined, { numeric: true, sensitivity: 'base' }));
        const childLinks = childrenFiles.map((f) => `- [[${f.basename}]]`).join('\n');

        let navBlock = `> **Parent:** ${parentLink}\n`;
        if (childrenFiles.length > 0) {
            navBlock += `> **Branches:**\n${childLinks.split('\n').map((l) => '> ' + l).join('\n')}\n`;
        }

        await this.app.vault.process(file, (content) => {
            const navRegex = /^> \*\*Parent:\*\*.*(?:\r?\n> \*\*Branches:\*\*(?:\r?\n> - .*)*)?\r?\n?/m;
            let cleanedContent = content.replace(/%% 4I-NAV-START %%[\s\S]*?%% 4I-NAV-END %%\r?\n?/g, '');
            cleanedContent = cleanedContent.replace(/(?:\r?\n)*tags:\r?\n(?:- .*(?:\r?\n)?)+$/g, '');

            const frontmatterRegex = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;
            if (navRegex.test(cleanedContent)) {
                return cleanedContent.replace(navRegex, navBlock);
            } else {
                const match = cleanedContent.match(frontmatterRegex);
                if (match) {
                    return cleanedContent.slice(0, match[0].length) + '\n' + navBlock + '\n' + cleanedContent.slice(match[0].length).trimStart();
                } else {
                    return navBlock + '\n' + cleanedContent.trimStart();
                }
            }
        });
    }

    async organizeFile(file, id, level, parentFile) {
        let expectedFolderPath = "";

        if (level === 2) {
            expectedFolderPath = file.basename;
        } else if (parentFile) {
            const parentFolder = (!parentFile.parent || parentFile.parent.path === "/") ? "" : parentFile.parent.path;
            if (level < 6) {
                expectedFolderPath = parentFolder ? `${parentFolder}/${file.basename}` : file.basename;
            } else {
                expectedFolderPath = parentFolder;
            }
        } else {
            return; 
        }

        if (expectedFolderPath !== "" && expectedFolderPath !== "/") {
            await this.createFolderRecursively(expectedFolderPath);
        }

        const expectedFilePath = expectedFolderPath === "" ? file.name : `${expectedFolderPath}/${file.name}`;
        if (file.path !== expectedFilePath) {
            await this.app.fileManager.renameFile(file, expectedFilePath);
        }
    }

    async createFolderRecursively(folderPath) {
        const parts = folderPath.split('/');
        let current = '';
        for (const part of parts) {
            if (part === '') continue;
            current = current === '' ? part : `${current}/${part}`;
            const exists = this.app.vault.getAbstractFileByPath(current);
            if (!exists) {
                await this.app.vault.createFolder(current);
            }
        }
    }
}

module.exports = FourISystemPlugin;
