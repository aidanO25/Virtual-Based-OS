var TSOS;
(function (TSOS) {
    class DiskSystemDeviceDriver extends TSOS.DeviceDriver {
        trackMax = 4; // Max tracks
        sectorMax = 8; // Max sectors
        blockMax = 8; // Max blocks
        constructor() {
            super();
            this.driverEntry = this.krnDiskDriverEntry;
            this.isr = null; // Disk system doesn't have an interrupt yet
        }
        // Entry point for the disk driver
        krnDiskDriverEntry() {
            // Initialization routine for the Disk System Device Driver
            this.status = "disk loaded";
            try {
                // Check if sessionStorage is available
                if (typeof sessionStorage === "undefined") {
                    _Kernel.krnTrace("SessionStorage is not supported in this environment.");
                }
                // Clear and initialize the file system
                this.initializeFileSystem();
                // Log success
                _Kernel.krnTrace("Disk System Device Driver initialized successfully.");
            }
            catch (error) {
                this.status = "failed";
                _Kernel.krnTrace(`Disk System Device Driver failed to initialize: ${error.message}`);
            }
        }
        // Helper method to initialize the file system
        initializeFileSystem() {
            sessionStorage.clear(); // Clear previous data
            for (let t = 0; t <= this.trackMax; t++) {
                for (let s = 0; s <= this.sectorMax; s++) {
                    for (let b = 0; b <= this.blockMax; b++) {
                        const key = `${t}:${s}:${b}`;
                        const value = JSON.stringify({
                            used: false, // Whether the block is used
                            next: "0:0:0", // Pointer to the next block
                            data: "0".repeat(60), // Data storage (60 bytes)
                        });
                        sessionStorage.setItem(key, value);
                    }
                }
            }
        }
    }
    TSOS.DiskSystemDeviceDriver = DiskSystemDeviceDriver;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=diskSystemDeviceDriver.js.map