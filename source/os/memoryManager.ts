/*
This is the memory manager class which is key for managing memory allocation for processes
It is in charge of allocating memory and returning a process id for each loaded program
I bet it will come in handy greatly when we are FORCED to run 3 programs simultaneously
*/

module TSOS {
    export class MemoryManager {
        private memoryAccessor: MemoryAccessor;
        private nextPID: number; // to keep track of the next available PID

        public processResidentList: PCB[]; // an array to store PCBs
        public readyQueue: PCB[] = []; //processes that are ready to execute.

        private partitions: number = 3; // number of memory partitions (0, 1, 2)
        private availablePartitions: boolean[]; // keeps track of available partitions as truth values

        constructor(memoryAccessor: MemoryAccessor) {
            this.memoryAccessor = memoryAccessor;
            this.nextPID = 0;
            this.processResidentList = []; // this is my resident list
            this.readyQueue = []; // this is the ready que used in context switching 
            this.availablePartitions = new Array(this.partitions).fill(true); // all partitions start as usasable 
        }

        // to keep track of where to start writing in memory
        private getBaseAddress(partition: number): number {
            switch (partition) {
                case 0: return 0;
                case 1: return 256;
                case 2: return 512;
            }
        }

        private findAvailablePartition(): number | undefined 
        {
            for (let i = 0; i < this.partitions; i++)
            {
                if (this.availablePartitions[i])
                {
                    return i;
                }
            }
            return undefined; // no free partition available
        }

        // oh i forgot to mention that i had chat help with this function
        private convertProgramToHexString(program: number[]): string {
            return program.map(byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
        }
        
        public loadProgram(program: number[]): number 
        {
            const partition = this.findAvailablePartition(); // to find a partition
            const baseAddress = this.getBaseAddress(partition); // gets the base address to know where to start loading the program in
            const limitAddress = baseAddress + 256; // Each partition is 256 bytes
            
            // ensures only three processes can be loaded 
            if (this.processResidentList.filter(pcb => pcb.location === "memory").length >= 3)
            {
                if (!_krnDiskSystemDriver.formatFlag)
                {
                    _StdOut.putText("Error: Disk is not formatted. Unable to save process to disk.");
                    _StdOut.advanceLine();
                    return null;
                }

                _StdOut.putText("Maximum process limit reached. Saving data on disk");
                _StdOut.advanceLine();
                const hexProgram = this.convertProgramToHexString(program);
                const pid = this.nextPID++; // uses next pid for to assign a unique pid in the case we delete one
                const filename = `process_${pid}`;
                const result = _krnDiskSystemDriver.create(filename);
                if(!result)
                {
                    _StdOut.putText("Error creating process on disk");
                    return null;
                }

                _krnDiskSystemDriver.writeFile(filename, hexProgram);
                const pcb = new PCB(pid, 0, 0); // no memory partition because well its on the disk
                pcb.location = "disk";
                this.processResidentList.push(pcb);
                this.readyQueue.push(pcb);
                pcb.state = "ready";
                TSOS.Control.updatePcbDisplay();


                _StdOut.putText(`Program with pid: ${pid} loaded into memory with filename process_${pid}`);
                _StdOut.advanceLine();
                return pid;
            }
            // checks if the program length exceeds the partition size and if so it says so 
            else if (program.length > 256) 
            {
                _StdOut.putText("Program size exceeds partition size.");
                return null; // this ensures the program isn't loaded in
            }
        
            // loads the program into memory
            for (let i = 0; i < program.length; i++) 
            {
                this.memoryAccessor.write(baseAddress + i, program[i]);
            }
        
            // creates a new PCB for the process with the right base and limit addresses
            const pcb = new PCB(this.nextPID++, baseAddress, limitAddress);

            this.processResidentList.push(pcb); // adds the pcb to the proces resident list
            this.readyQueue.push(pcb); // adds it to the ready queue if it's in the ready state
            pcb.state = "resident";

            this.availablePartitions[partition] = false; // marks the partition as taken
            pcb.location = "memory";
        
            // Debugging output
            _StdOut.putText(`Program loaded into memory with PID ${pcb.PID}`);


            TSOS.Control.updatePcbDisplay();
            return pcb.PID; // returns the program's process ID
        }

        // retrieves a PCB by its PID
        public getPCB(pid: number): PCB | undefined
        {
            return this.processResidentList.find(pcb => pcb.PID === pid);
        }

        // this is for updating the pcb dispaly used by console.ts
        public getAllPIDs(): number[] {
            return this.processResidentList.map(pcb => pcb.PID);
        }

        // gets all PCBs (really to just display each process wiht teh shell command ps)
        public getAllPCBs(): PCB[]
        {
            return this.processResidentList;
        }

        // clears all instances of memory
        public clearMemory(): void 
        {
            // clears memory through MemoryAccessor
            this.memoryAccessor.clearMemory();

            this.processResidentList = []; // resets the PCBs array
        
            // marks all partitions as available
            this.availablePartitions.fill(true);
        
        }

        //-----------------------------------------------------------------------
        // the code below specifically deals with the disk
        public swapProcess(diskProcess: PCB): boolean
        {
            // Find a process in memory to roll out
            const memoryProcess = this.processResidentList.find(pcb => pcb.location === "memory");
            if (!memoryProcess || !this.rollOutProcess(memoryProcess))
            {
                _StdOut.putText("Failed to roll out process from memory.");
                return false;
            }
        
            // Roll in the disk-based process
            if (!this.rollInProcess(diskProcess))
            {
                _StdOut.putText("Failed to roll in process from disk.");
                return false;
            }
            TSOS.Control.updatePcbDisplay();
            return true;
        }

        public rollInProcess(pcb: PCB): boolean
        {
            const filename = `process_${pcb.PID}`;
            const programData = _krnDiskSystemDriver.readFile(filename);
            if (!programData)
            {
                return false;
            }
        
            const partition = this.findAvailablePartition();
            const baseAddress = this.getBaseAddress(partition);
            this.loadProcessToMemory(pcb, baseAddress, programData);
        
            pcb.location = "memory";
            pcb.base = baseAddress;
            pcb.limit = baseAddress + 256;
            this.availablePartitions[partition] = false;
        
            // removes the process from the disk
            _krnDiskSystemDriver.deleteFile(filename);
            return true;
        }

        public rollOutProcess(pcb: PCB): boolean
        {
            const memoryData = this.extractProcessMemory(pcb.base, pcb.limit);
            const filename = `process_${pcb.PID}`;
            if (!_krnDiskSystemDriver.create(filename) || 
                !_krnDiskSystemDriver.writeFile(filename, memoryData)){
                return false;
            }
        
            // updates PCB and memory state
            pcb.location = "disk";
            pcb.base = 0;
            pcb.limit = 0;
            this.availablePartitions[this.getPartitionIndex(pcb.base)] = true;
            return true;
        }


        private extractProcessMemory(base: number, limit: number): string 
        {
            let memoryData = "";
            for (let address = base; address <= limit; address++)
            {
                const byte = this.memoryAccessor.read(address);
                memoryData += byte.toString(16).padStart(2, "0").toUpperCase();
            }
            return memoryData;
        }

        private loadProcessToMemory(pcb: PCB, baseAddress: number, programData: string): void
        {
            let memoryIndex = baseAddress;
            for (let i = 0; i < programData.length; i += 2)
            {
                const byte = parseInt(programData.substring(i, i + 2), 16);
                this.memoryAccessor.write(memoryIndex++, byte);
            }
            pcb.base = baseAddress;
            pcb.limit = baseAddress + 256;
            pcb.state = "ready";
            this.availablePartitions[this.getPartitionIndex(baseAddress)] = false;
        }

        private getPartitionIndex(base: number): number
        {
            switch (base)
            {
                case 0: return 0;
                case 256: return 1;
                case 512: return 2;
                default: return -1; // invalid partition
            }
        }
        

    }
}