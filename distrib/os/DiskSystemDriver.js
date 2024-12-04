// /this i my disk system device driver which uses HTML 5 session storage 
var TSOS;
(function (TSOS) {
    class DiskSystemDriver extends TSOS.DeviceDriver {
        trackMax = 3;
        sectorMax = 7;
        blockMax = 7;
        formatFlag = false;
        constructor() {
            super();
            this.driverEntry = this.krnDiskDriverEntry;
            this.isr = null; // No interrupt service routine for now.
        }
        krnDiskDriverEntry() {
            // initialization routine for the disk sytem device driver 
            this.status = "disk loaded";
            // both a debug and calls the initialization funciton if viable
            try {
                // checks if sessionStorage is available 
                if (typeof sessionStorage === "undefined") {
                    _Kernel.krnTrace("SessionStorage is not supported in this environment.");
                    throw new Error("SessionStorage unavailable");
                }
                // Log success
                _Kernel.krnTrace("Disk System Device Driver loaded not formatted.");
            }
            catch (error) {
                this.status = "failed";
                _Kernel.krnTrace(`Disk System Device Driver failed to initialize: ${error.message}`);
            }
        }
        // initializes the system. Im going to be honoest I needed Chat help with the logic behind this
        initializeFileSystem() {
            sessionStorage.clear(); // Clear previous data
            for (let t = 0; t <= this.trackMax; t++) {
                for (let s = 0; s <= this.sectorMax; s++) {
                    for (let b = 0; b <= this.blockMax; b++) {
                        const key = `${t}:${s}:${b}`;
                        const value = JSON.stringify({
                            used: false, // Block is initially free
                            next: "0:0:0", // No next block
                            data: "0".repeat(60), // Initialize with 60 bytes of empty data
                        });
                        sessionStorage.setItem(key, value);
                    }
                }
            }
        }
        // updates the disk display
        updateDiskDisplay() {
            const tableBody = document.getElementById("diskTable").getElementsByTagName("tbody")[0];
            tableBody.innerHTML = ""; // clears the table for updates (im sure there is a better maybe fasterw way to do this)
            // I had chat help in the logic behind these loops
            for (let t = 0; t <= this.trackMax; t++) {
                for (let s = 0; s <= this.sectorMax; s++) {
                    for (let b = 0; b <= this.blockMax; b++) {
                        const key = `${t}:${s}:${b}`;
                        const blockData = sessionStorage.getItem(key);
                        const row = tableBody.insertRow(); // Create a new row for every T:S:B
                        // checks that the specific block reference contains valid data 
                        // really to prevent any errors if data is null or undefined in which it would just skip processing that block
                        if (blockData) {
                            // parses the block data and displays the contents
                            const parsedData = JSON.parse(blockData);
                            row.insertCell(0).innerText = key; // T:S:B
                            row.insertCell(1).innerText = parsedData.used ? "1" : "0"; // in use
                            row.insertCell(2).innerText = parsedData.next; // reference
                            row.insertCell(3).innerText = parsedData.data; // data
                        }
                        else {
                            // display empty blocks
                            row.insertCell(0).innerText = key; // T:S:B
                            row.insertCell(1).innerText = "0"; // not in use
                            row.insertCell(2).innerText = "0:0:0"; // default reference
                            row.insertCell(3).innerText = "0".repeat(60); // filled with empty data (is 0 the best use?)
                        }
                    }
                }
            }
        }
        // formats the disk. I still have to add the shell command to do so. 
        // currently it is formatted on load
        format() {
            sessionStorage.clear(); // clear all previous data
            this.initializeFileSystem();
            this.updateDiskDisplay(); // updates the display 
            this.formatFlag = true;
            _Kernel.krnTrace("Disk formatted successfully.");
        }
        // creates a file with the name provided
        create(filename) {
            // ensures we dont create a file without the disk being formatted
            // in the shell command there is a message to format the disk 
            if (this.formatFlag === false) {
                return false;
            }
            else {
                // converts the filename to hex
                const hexFilename = filename
                    .split("")
                    .map(function (char) {
                    return char.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0");
                })
                    .join("");
                // checks if the filename is too long
                if (hexFilename.length > 60) {
                    _Kernel.krnTrace(`Filename '${filename}' is too long.`);
                    return false;
                }
                // finds a free block in the directory
                for (let s = 0; s <= this.sectorMax; s++) {
                    for (let b = 1; b <= this.blockMax; b++) // b is set to 1 so we dont use the first block 
                     {
                        const key = `0:${s}:${b}`;
                        const blockData = JSON.parse(sessionStorage.getItem(key)); // i had chap help with this part:
                        // parese converts the retrieved string back into a JavaScript object or data structure. 
                        // This is needed because the data was originally stored as a JSON object, 
                        // but it is saved in sessionStorage as a string.
                        if (!blockData.used) {
                            blockData.used = true; // marks the block as used
                            blockData.next = key; // reference points to itself since there isn't any data in it yet
                            blockData.data = hexFilename.padEnd(60, "0"); // pad the rest of the file with 0s
                            sessionStorage.setItem(key, JSON.stringify(blockData)); // i had chat help writing this part, specifically with using json.stringify:
                            // Converts the blockData object back into a string format so it can be stored in sessionStorage.
                            _Kernel.krnTrace(`File '${filename}' created successfully at ${key}.`);
                            this.updateDiskDisplay(); // updates the display 
                            return true;
                        }
                    }
                }
                // in the case that there aren't any more available blocks:
                _Kernel.krnTrace("No free directory block available to create the file.");
                return false;
            }
        }
    }
    TSOS.DiskSystemDriver = DiskSystemDriver;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=DiskSystemDriver.js.map