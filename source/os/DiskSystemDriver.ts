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
        
        // function to write data to a file name
        public writeFile(filename: string, data: string): boolean 
        {
            // ensures we dont create a file without the disk being formatted
            // in the shell command there is a message to format the disk 
            if (!this.formatFlag) 
            {
                _StdOut.putText("Disk is not formatted.");
                return false;
            }
        
            // converts the data and filename into hex forat for storage on disk
            const hexData = this.convertToHex(data);
            const filenameHex = this.convertToHex(filename);
        
           // locates the file's directory entry (no chat help this time, got the hang of it)
            for (let t = 0; t <= this.trackMax; t++)
            {
                for (let s = 0; s <= this.sectorMax; s++)
                {
                    for (let b = 0; b <= this.blockMax; b++)
                    {
                        const key = `${t}:${s}:${b}`;
                        const blockData = JSON.parse(sessionStorage.getItem(key));

                        // locates the block per filename and ensures it's used
                        if (blockData.used && blockData.data.startsWith(filenameHex))
                        {
                            
                            // clears any previously allocated blocks (I am aware that in reality the data isn't cleared, its just made available but I figured
                            // that I'd keep it like this to minimize issues. I'd like to change it later, but now is not the time)
                            let currentReference = blockData.next;
                            blockData.next = "0:0:0";
                            sessionStorage.setItem(key, JSON.stringify(blockData));
        
                            while (currentReference !== "0:0:0")
                            {
                                const blockKey = currentReference;
                                const block = JSON.parse(sessionStorage.getItem(blockKey));
                                currentReference = block.next;
        
                                // marks the block as unused and resets the data
                                block.used = false;
                                block.data = "0".repeat(60);
                                block.next = "0:0:0";
                                sessionStorage.setItem(blockKey, JSON.stringify(block));
                            }
        
                            // writes the new data to the file
                            currentReference = this.getNextFreeDataBlock();
                            if (!currentReference)
                            {
                                _StdOut.putText("No free space available on disk.");
                                return false;
                            }
        
                            // updates the block with the first data block reference
                            blockData.next = currentReference;
                            sessionStorage.setItem(key, JSON.stringify(blockData));
        
                            let remainingData = hexData; // initializes the remaining data to be written
        
                            // continues to write until all data has been stored
                            while (remainingData.length > 0)
                            {
                                const blockKey = currentReference;
                                const block = JSON.parse(sessionStorage.getItem(blockKey));
        
                                // marks the block as used and writes the data
                                block.used = true;
                                block.data = remainingData.slice(0, 60).padEnd(60, "0");
                                sessionStorage.setItem(blockKey, JSON.stringify(block));
        
                                remainingData = remainingData.slice(60); // removes the written portion of data from remainingData
        
                                // if there is still more data to write, get the next free block to write to
                                if (remainingData.length > 0)
                                {
                                    const nextBlock = this.getNextFreeDataBlock();
                                    if (!nextBlock)
                                    {
                                        _StdOut.putText("Not enough space to write the entire file.");
                                        return false;
                                    }
        
                                    block.next = nextBlock; // updates the reference to the next block
                                    sessionStorage.setItem(blockKey, JSON.stringify(block));
                                    currentReference = nextBlock;
                                } 
                                else
                                {
                                    block.next = "0:0:0"; // end of the file
                                    sessionStorage.setItem(blockKey, JSON.stringify(block));
                                }
                            }
                            this.updateDiskDisplay();
                            return true;
                        }
                    }
                }
            }
            _StdOut.putText(`File "${filename}" not found.`);
            return false;
        }

        // function to read data from the file name
        public readFile(filename: string): string | null
        {
            // ensures we dont create a file without the disk being formatted
            // in the shell command there is a message to format the disk 
            if(this.formatFlag === false)
            {
                return null;
            }
            else
            {
                // locates the file's directory entry 
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
                                // traverses the file's data blocks and "collects" the data
                                let currentReference = blockData.next;
                                let fileContents = "";

                                while(currentReference !== "0:0:0")
                                {
                                    const dataBlock = JSON.parse(sessionStorage.getItem(currentReference));
                                    fileContents += dataBlock.data.trim(); // this appends the data and trims the padded 0s
                                    currentReference = dataBlock.next; // moves to the next block
                                }
                                return this.convertHexToString(fileContents);
                            }
                        }
                    }
                }
                _StdOut.putText(`File "${filename}" not found. `);
                return null;
            }
        }

        // allows a file to be deleted
        public deleteFile(filename: string): boolean
        {
            // check if the disk has been formatted
            if(!this.formatFlag)
            {
                _StdOut.putText("Unable to delete file.");
                return false;
            }

            const filenameHex = this.convertToHex(filename);

            // loopoing through the disk to find the filename
            for (let t = 0; t <= this.trackMax; t++)
            {
                for (let s = 0; s <= this.sectorMax; s++)
                {
                    for (let b = 0; b <= this.blockMax; b++)
                    {
                        const key = `${t}:${s}:${b}`;
                        const blockData = JSON.parse(sessionStorage.getItem(key));

                        if (blockData.used && blockData.data.startsWith(filenameHex)) 
                        {
                            // clears the directory entry
                            blockData.used = false;
                            blockData.data = "0".repeat(60);

                            const firstReference = blockData.next;
                            blockData.next = "0:0:0";
                            sessionStorage.setItem(key, JSON.stringify(blockData));

                            // clears all data blocks associated with the filename
                            let currentReference = firstReference;
                            while (currentReference !== "0:0:0")
                            {
                                const blockKey = currentReference;
                                const block = JSON.parse(sessionStorage.getItem(blockKey));
                                currentReference = block.next;
        
                                // "resets" the used blocks to unused
                                block.used = false;
                                block.data = "0".repeat(60);
                                block.next = "0:0:0";
                                sessionStorage.setItem(blockKey, JSON.stringify(block));
                            }
        
                            this.updateDiskDisplay();
                            _StdOut.putText(`File "${filename}" deleted successfully.`);
                            return true;
                        }
                    }
                }
            }
            _StdOut.putText(`File "${filename}" not found. `);
            return false;
        }

        // lets you rename a file
        public renameFile(filename: string, renamedName: string): boolean
        {
            // ensures the disk has been formatted
            if(!this.formatFlag)
            {
                _StdOut.putText("File must be formatted");
                return false;
            }

            // loop through the disk to find the filename provided
            for (let t = 0; t <= this.trackMax; t++)
            {
                for (let s = 0; s <= this.sectorMax; s++)
                {
                    for (let b = 0; b <= this.blockMax; b++)
                    {
                        const key = `${t}:${s}:${b}`;
                        const blockData = JSON.parse(sessionStorage.getItem(key));

                        const originalName = this.convertToHex(filename);
                        const newName = this.convertToHex(renamedName); 


                        if (blockData.used && blockData.data.startsWith(originalName)) 
                        {
                            // updating the directory with new name
                            blockData.data = newName.padEnd(60, "0");
                            sessionStorage.setItem(key, JSON.stringify(blockData)); //saves the update

                            _StdOut.putText(`File "${filename}" changed to "${renamedName}" . `);
                            this.updateDiskDisplay();
                            return true;
                        }
                    }
                }
            }
            _StdOut.putText("Unable to rename file");
            return false;
        }

        public listFiles(): string[]
        {
            // ensures the disk is formatted
            if (!this.formatFlag)
            {
                _StdOut.putText("Disk is not formatted.");
                return [];
            }
        
            const fileList: string[] = [];
        
            // iterate through track 0 to locate file names
            for (let s = 0; s <= this.sectorMax; s++)
            {
                for (let b = 1; b <= this.blockMax; b++)
                {
                    const key = `0:${s}:${b}`;
                    const blockData = JSON.parse(sessionStorage.getItem(key));
        
                    if (blockData.used)
                    {
                        // gets the file name from the blocks data
                        const hexFilename = blockData.data.trim();
                        const filename = this.convertHexToString(hexFilename);
                        fileList.push(filename);
                    }
                }
            }
            return fileList;
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

        // another helper to convert hex to a string 
        private convertHexToString(hex: string): string
        {
            let str = "";
            for (let i = 0; i < hex.length; i += 2)
            {
                const charCode = parseInt(hex.slice(i, i + 2), 16);
                str += String.fromCharCode(charCode);
            }
            return str;
        }
    }
}
