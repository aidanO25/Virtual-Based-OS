// /this i my disk system device driver which uses HTML 5 session storage 
var TSOS;
(function (TSOS) {
    class DiskSystemDriver extends TSOS.DeviceDriver {
        trackMax = 3;
        sectorMax = 7;
        blockMax = 7;
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
                // Initialize the file system
                this.initializeFileSystem();
                this.updateDiskDisplay();
                // Log success
                _Kernel.krnTrace("Disk System Device Driver initialized successfully.");
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
            // initializes all tracks, sectors, and blocks
            sessionStorage.clear();
            console.log("Disk formatted.");
        }
    }
    TSOS.DiskSystemDriver = DiskSystemDriver;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=DiskSystemDriver.js.map