// /this i my disk system device driver which uses HTML 5 session storage 
module TSOS {

    export class DiskSystemDriver extends DeviceDriver 
    {
        private trackMax: number = 3; 
        private sectorMax: number = 7;
        private blockMax: number = 7;
        public formatFlag: boolean = false;

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
                // Log success
                _Kernel.krnTrace("Disk System Device Driver loaded not formatted.");
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
        }

        // updates the disk display
        public updateDiskDisplay(): void 
        {
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
                        if (blockData) 
                        {
                            // parses the block data and displays the contents
                            const parsedData = JSON.parse(blockData);
                            row.insertCell(0).innerText = key; // T:S:B
                            row.insertCell(1).innerText = parsedData.used ? "1" : "0"; // in use
                            row.insertCell(2).innerText = parsedData.next; // reference
                            row.insertCell(3).innerText = parsedData.data; // data
                        } 
                        else 
                        {
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
        public format(): void 
        {
            sessionStorage.clear(); // clear all previous data
            this.initializeFileSystem();
            this.updateDiskDisplay(); // updates the display 
            this.formatFlag = true;
            _Kernel.krnTrace("Disk formatted successfully.");
        }

        // creates a file with the name provided
        public create(filename: string): boolean
        {
            // ensures we dont create a file without the disk being formatted
            // in the shell command there is a message to format the disk 
            if(this.formatFlag === false)
            {
                return false;
            }
            else
            {
                // converts the filename to hex
                const hexFilename = filename
                .split("")
                .map(function (char) 
                {
                    return char.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0");
                })
                .join("");
            
                // checks if the filename is too long
                if (hexFilename.length > 60)
                {
                    _Kernel.krnTrace(`Filename '${filename}' is too long.`);
                    return false;
                }
            
                // finds a free block in the directory
                for (let s = 0; s <= this.sectorMax; s++)
                {
                    for (let b = 1; b <= this.blockMax; b++) // b is set to 1 so we dont use the first block 
                    {
                        const key = `0:${s}:${b}`;
                        const blockData = JSON.parse(sessionStorage.getItem(key)); // i had chap help with this part:
                        // parese converts the retrieved string back into a JavaScript object or data structure. 
                        // This is needed because the data was originally stored as a JSON object, 
                        // but it is saved in sessionStorage as a string.
            
                        if (!blockData.used)
                        {
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

        // function to write data to a filename
        public writeFile(filename: string, data: string): boolean
        {
            // locates the file's directory entry (no chat help this time, got the hang of it)
            for (let t = 0; t <= this.trackMax; t++)
            {
                for (let s = 0; s <= this.sectorMax; s++)
                {
                    for (let b = 0; b <= this.blockMax; b++)
                    {
                        const key = `${t}:${s}:${b}`;
                        const blockData = JSON.parse(sessionStorage.getItem(key));
                        
                        // checks if the block is in use and matches the filename
                        if (blockData.used && blockData.data.startsWith(this.convertToHex(filename))) 
                        {

                            // writes the data to the next available data block
                            let currentReference = this.getNextFreeDataBlock();
                            if (!currentReference)
                            {
                                _StdOut.putText("No free space available on disk.");
                                return false;
                            }
        
                            // updates the directory entry to point to the first data block
                            blockData.next = currentReference;
                            sessionStorage.setItem(key, JSON.stringify(blockData));
        
                            // breaks the data into 60 byte blocks to then write to the disk
                            const hexData = this.convertToHex(data);
                            let remainingData = hexData;
                            let currentKey = currentReference;
        
                            while (remainingData.length > 0)
                            {
                                const blockKey = currentKey;
                                const block = JSON.parse(sessionStorage.getItem(blockKey));
                                block.used = true;
        
                                // only write up to 60 bytes
                                block.data = remainingData.slice(0, 60).padEnd(60, "0");
                                remainingData = remainingData.slice(60);
        
                                // if needed get teh next block
                                if (remainingData.length > 0)
                                {
                                    const nextBlock = this.getNextFreeDataBlock();
                                    if (!nextBlock) {
                                        _StdOut.putText("Not enough space to write the entire file.");
                                        return false;
                                    }
                                    block.next = nextBlock;
                                    currentKey = nextBlock;
                                } 
                                else
                                {
                                    block.next = "0:0:0"; // end of the file
                                }

                                // save the block back to storage
                                sessionStorage.setItem(blockKey, JSON.stringify(block));
                            }
                            this.updateDiskDisplay(); // updates the display
                            return true; // shell outputs that it has been written
                        }
                    }
                }
            }
            _StdOut.putText(`File "${filename}" not found.`); // wrong filename or it just doesn't exist
            return false;
        }
        

        // helps to find the next free data blcok
        private getNextFreeDataBlock(): string | null
        {
            for (let t = 1; t <= this.trackMax; t++)
            {
                for (let s = 0; s <= this.sectorMax; s++)
                {
                    for (let b = 0; b <= this.blockMax; b++)
                    {
                        const key = `${t}:${s}:${b}`;
                        const blockData = JSON.parse(sessionStorage.getItem(key));
                        if (!blockData.used)
                        {
                            return key;
                        }
                    }
                }
            }
            return null; // no free block found. can't imagine there would ever be a case where there was no block
        }
        
        // function to convert a sting to hex to make things easier
        private convertToHex(input: string): string 
        {
            return input
                .split("")
                .map(function (char) 
                {
                    return char.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0");
                })
                .join("");
        }
    }
}
