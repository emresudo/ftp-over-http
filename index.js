import express from "express";
import cors from "cors";
import async from "async";
import { readFile, rename, unlink, readdir, writeFile, mkdir, rmdir, cp } from "fs/promises";
import { dirname, join } from "path";
import multer from "multer";
import admZip from "adm-zip";
const upload = multer()

const app = express();
const port = 4000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(express.raw({ limit: "100mb" }));

app.use(cors());

const dir = "/app";

app.get("/files", async (req, res) => {
    let results = [];
    const list = await readdir(dir, { recursive: true, withFileTypes: true });

    for (const file of list) {
        try {
            if (file.path.includes(".git")) {
                continue;
            }
            if (file.path.includes("node_modules")) {
                continue;
            }

            if (file.isDirectory()) {
                results.push({
                    type: 1,
                    path: file.path + "/" + file.name
                });
            } else {
                results.push({
                    type: 0,
                    path: file.path + "/" + file.name
                });
            }
        } catch (error) { }
    }

    // const CONCURRENCY_LIMIT = 30;

    // const responses = await async.mapLimit(
    //     results,
    //     CONCURRENCY_LIMIT,
    //     async (f) => { if (f.type == 0) return readFile(f.path); }
    // );

    // for (let index = 0; index < responses.length; index++) {
    //     results[index].content = responses[index]?.toString();
    // }

    return res.json(results);
});

app.post("/rm", async (req, res) => {
    try {
        const { fileName } = req.body;
        if (!fileName) return res.json({ status: false, message: "Please enter file name." });

        const path = join(dir, fileName);

        await unlink(path);

        res.json({ status: true });
    } catch (error) {
        return res.json({ status: false, error });
    }
});

app.post("/rmdir", async (req, res) => {
    try {
        const { folder } = req.body;
        if (!folder) return res.json({ status: false, message: "Please enter folder name." });

        if (folder.includes("..")) {
            return res.json({ status: false, message: "Please enter valid file name.", });
        }

        const path = join(dir, folder);

        await rmdir(path, { recursive: true, force: true });

        res.json({ status: true });
    } catch (error) {
        return res.json({ status: false, error });
    }
});

app.post("/read", async (req, res) => {
    try {
        const { fileName } = req.body;

        if (!fileName || fileName.includes("..")) {
            return res.json({ status: false, message: "Please enter valid file name.", });
        }

        const path = join(dir, fileName);
        const content = await readFile(path, { encoding: "utf-8" });

        res.json({
            status: true,
            content,
        });
    } catch (error) {
        console.log(error);
        return res.json({ status: false, error });
    }
});

app.post("/move", async (req, res) => {
    try {
        const { oldName, newName } = req.body;

        if (!oldName || !oldName) {
            return res.json({ status: false, message: "Please enter file name and new file name.", });
        }

        if (oldName.includes("..") || newName.includes("..")) {
            return res.json({ status: false, message: "Please enter valid file name and new file name.", });
        }

        const oldPath = join(dir, oldName);
        const newPath = join(dir, newName);

        await mkdir(dirname(newPath), { recursive: true })

        await rename(oldPath, newPath);

        return res.json({ status: true });
    } catch (error) {
        return res.json({ status: false, error });
    }
});

app.post("/put", async (req, res) => {
    try {
        const { filename, content } = req.body;

        if (!filename) return res.json({ status: false, message: "Please enter a filename.", });

        if (filename.includes("..")) {
            return res.json({ status: false, message: "Please enter valid file name and new file name.", });
        }

        const filePath = join(dir, filename);

        await mkdir(dirname(filePath), { recursive: true })

        await writeFile(filePath, content);

        return res.json({ status: true });
    } catch (error) {
        return res.json({ status: false, error });
    }
});

app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const { fileName } = req.body;

        if (!fileName) return res.json({ status: false, message: "Please enter a filename.", });

        if (fileName.includes("..")) {
            return res.json({ status: false, message: "Please enter valid file name and new file name.", });
        }

        const filePath = join(dir, fileName);

        await mkdir(dirname(filePath), { recursive: true })

        await writeFile(filePath, req.file.buffer);

        return res.json({ status: true });
    } catch (error) {
        return res.json({ status: false, error });
    }
});

app.post("/unzip", async (req, res) => {
    try {
        const { filename } = req.body;

        if (!filename) return res.json({ status: false, message: "Please enter a filename.", });

        if (filename.includes("..")) {
            return res.json({ status: false, message: "Please enter valid file name and new file name.", });
        }

        const filePath = join(dir, filename);
        const currentDir = dirname(filePath);

        const zip = new admZip(filePath);
        zip.extractAllTo(currentDir, true);
        return res.json({ status: true });
    } catch (error) {
        return res.json({ status: false, error });
    }
});

app.post("/mkdir", async (req, res) => {
    try {
        const { folder } = req.body;

        if (!folder) return res.json({ status: false, message: "Please enter a folder name.", });

        if (folder.includes("..")) {
            return res.json({ status: false, message: "Please enter valid folder name.", });
        }

        const folderPath = join(dir, folder);

        await mkdir(folderPath, { recursive: true })

        return res.json({ status: true });
    } catch (error) {
        return res.json({ status: false, error });
    }
});

app.post("/cp", async (req, res) => {
    try {
        const { source, destination } = req.body;

        if (!source) return res.json({ status: false, message: "Please enter a folder name.", });
        if (!destination) return res.json({ status: false, message: "Please enter a folder name.", });

        if (source.includes("..")) {
            return res.json({ status: false, message: "Please enter valid file folder name.", });
        }

        if (destination.includes("..")) {
            return res.json({ status: false, message: "Please enter valid file folder name.", });
        }

        const sourceFolderPath = join(dir, source);
        const destinationFolderPath = join(dir, destination);

        await cp(sourceFolderPath, destinationFolderPath, { recursive: true })

        return res.json({ status: true });
    } catch (error) {
        return res.json({ status: false, error });
    }
});

app.listen(port, () => {
    console.log(`Listening ::${port}`);
});