const JSZip = (await import('https://cdn.skypack.dev/jszip')).default;
const filenamify = (await import('https://cdn.skypack.dev/filenamify/browser')).default;
const TurndownService = (await import('https://cdn.skypack.dev/turndown')).default;
const turndownService = new TurndownService();
const zip = new JSZip();

const journalDir = game.journal.directory;

function exploreRoot(zip, journalDir) {
  for (const entry of journalDir.documents.filter((entry) => entry.folder === null)) {
    console.log("adding entry", entry.name);
    zip.file(`${entry.name}.md`, turndownService.turndown(entry.data.content));
  }
}

function exploreFolders(zip, journalDir) {
  let toExplore = journalDir.folders.filter((folder) => folder.depth === 1).map((folder) => ({ folder, parentFolder: null }));
  while (toExplore.length > 0) {
    const { folder, parentFolder } = toExplore.pop();

    const folderName = filenamify(folder.name);
    if (parentFolder === null) {
      console.log("creating folder", folderName);
    } else {
      console.log("creating folder", folderName, "under", parentFolder.root);
    }
    const zipFolder = (parentFolder === null) ? zip.folder(folderName) : parentFolder.folder(folderName);

    for (const entry of folder.content) {
      const filename = `${filenamify(entry.name)}.md`;
      const content = turndownService.turndown(entry.data.content);
      zipFolder.file(filename, content);
      console.log("creating file", filename, "under folder", folderName);
    }

    toExplore = toExplore.concat(folder.children.map((folder) => ({ folder, parentFolder: zipFolder })));
  }
}

async function saveZipToDisk(zip, filename) {
  const blob = await zip.generateAsync({ type: 'blob' });
  saveDataToFile(blob, "application/zip", filename);
}

exploreRoot(zip, journalDir);
exploreFolders(zip, journalDir);
await saveZipToDisk(zip, "foundryjournals.zip");
