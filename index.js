import express from "express";
import cors from "cors";
import async from "async";
import { readFile, rename, unlink, readdir, writeFile, mkdir, rmdir, cp } from "fs/promises";
import { dirname, join } from "path";

const app = express();
const port = 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const dir = "/app";

app.get("/files", async (req, res) => {
    let results = [];
    const list = await readdir(dir, { recursive: true, withFileTypes: true });

    for (const file of list) {
        try {
            if (file.isDirectory()) {
                continue;
            }
            if (file.path.includes(".git")) {
                continue;
            }
            if (file.path.includes("node_modules")) {
                continue;
            }

            results.push({
                path: file.path + "/" + file.name,
                content: null,
            });
        } catch (error) { }
    }

    const CONCURRENCY_LIMIT = 30;

    const responses = await async.mapLimit(
        results,
        CONCURRENCY_LIMIT,
        async (f) => {
            return readFile(f.path);
        }
    );

    for (let index = 0; index < responses.length; index++) {
        results[index].content = responses[index].toString();
    }

    return res.json(results);
});

app.post("/rm", async (req, res) => {
    try {
        const { fileName } = req.body;
        if (!fileName) return res.json({ status: false, message: "Please enter file name." });

        const path = join(dir, dosyaAdi);

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

app.get("/read", async (req, res) => {
    try {
        const { fileName } = req.body;

        if (fileName.includes("..")) {
            return res.json({ status: false, message: "Please enter valid file name.", });
        }

        const path = join(dir, fileName);
        const content = await readFile(path, { encoding: "utf-8" });

        res.json({
            status: true,
            content,
        });
    } catch (error) {
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

app.post("/mkdir", async (req, res) => {
    try {
        const { folder } = req.body;

        if (!folder) return res.json({ status: false, message: "Please enter a folder name.", });

        if (folder.includes("..")) {
            return res.json({ status: false, message: "Please enter valid folder name.", });
        }

        const folderPath = join(dir, folder);

        await mkdir(dirname(folderPath), { recursive: true })

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
        const destinationFolderPath = join(join(dir, destination), source);

        await cp(sourceFolderPath, destinationFolderPath, { recursive: true })

        return res.json({ status: true });
    } catch (error) {
        return res.json({ status: false, error });
    }
});

app.listen(port, () => {
    console.log(`Listening ::${port}`);
});