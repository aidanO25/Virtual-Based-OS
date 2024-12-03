// /this i my disk system device driver which uses HTML 5 session storage 
module TSOS {

    export class DiskSystemDriver extends DeviceDriver 
    {
        private trackMax: number = 4; // 0 - 3
        private sectorMax: number = 8; // 0-7
        private blockMax: number = 8; // 0-7

        constructor() 
        {
            super();
            this.driverEntry = this.krnDiskDriverEntry;
            this.isr = null; // No interrupt service routine for now.
        }

        public krnDiskDriverEntry(): void 
        {
            // initialization routine for the disk sytem device driver 
            this.status = "disk loaded";
        
            // both a debug and calls the initialization funciton if viable
            try 
            {
                // checks if sessionStorage is available 
                if (typeof sessionStorage === "undefined")
                {
                    _Kernel.krnTrace("SessionStorage is not supported in this environment.");
                    throw new Error("SessionStorage unavailable");
                }
        
                // Initialize the file system
                this.initializeFileSystem();
        
                // Log success
                _Kernel.krnTrace("Disk System Device Driver initialized successfully.");
            } 
            catch (error) 
            {
                this.status = "failed";
                _Kernel.krnTrace(`Disk System Device Driver failed to initialize: ${error.message}`);
            }
        }

        // initializes the system. Im going to be honoest I needed Chat help with the logic behind this
        private initializeFileSystem(): void {
            sessionStorage.clear(); // Clear previous data
            for (let t = 0; t <= this.trackMax; t++) {
                for (let s = 0; s <= this.sectorMax; s++) {
                    for (let b = 0; b <= this.blockMax; b++) {
                        const key = `${t}:${s}:${b}`;
                        const value = JSON.stringify({
                            used: false,          // Block is initially free
                            next: "0:0:0",        // No next block
                            data: "0".repeat(60), // Initialize with 60 bytes of empty data
                        });
                        sessionStorage.setItem(key, value);
                    }
                }
            }
            _Kernel.krnTrace("File system initialized in sessionStorage.");
        }

    }
}
