/*
This is the memory manager class which is key for managing memory allocation for processes
It is in charge of allocating memory and returning a process id for each loaded program
I bet it will come in handy greatly when we are FORCED to run 3 programs simultaneously
*/

module TSOS {
    export class MemoryManager {
        private memoryAccessor: MemoryAccessor;
        private nextPID: number; // to keep track of the next available PID
        private pcbs: PCB[]; // an array to store PCBs
        private partitions: number = 3; // number of memory partitions (0, 1, 2)
        private availablePartitions: boolean[]; // keeps track of available partitions as truth values

        constructor(memoryAccessor: MemoryAccessor) {
            this.memoryAccessor = memoryAccessor;
            this.nextPID = 0;
            this.pcbs = [];
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

        // finds the next available partition
        private findAvailablePartition(): number {
            for (let i = 0; i < this.partitions; i++) {
                if (this.availablePartitions[i]) {
                    return i;
                }
            }
            console.log("No available partitions.");
        }
        
        public loadProgram(program: number[]): number 
        {
            const partition = this.findAvailablePartition(); // to find a partition
            const baseAddress = this.getBaseAddress(partition); // gets the base address to know where to start loading the program in
            const limitAddress = baseAddress + 256; // Each partition is 256 bytes
        
            // checks if the program length exceeds the partition size and if so it says so 
            if (program.length > 256) 
            {
                console.log("Program size exceeds partition size.");
            }
        
            // loads the program into memory
            for (let i = 0; i < program.length; i++) 
            {
                this.memoryAccessor.write(baseAddress + i, program[i]);
            }
        
            // creates a new PCB for the process with the right base and limit addresses
            const pcb = new PCB(this.nextPID++, baseAddress, limitAddress);
            this.pcbs.push(pcb);
            this.availablePartitions[partition] = false; // marks the partition as taken
        
            console.log(`Program loaded into memory with PID ${pcb.PID}`);
            TSOS.Control.updatePcbDisplay();
            return pcb.PID; // returns the program's process ID
        }

        // retrieves a PCB by its PID
        public getPCB(pid: number): PCB | undefined
        {
            return this.pcbs.find(pcb => pcb.PID === pid);
        }

        // this is for updating the pcb dispaly used by console.ts
        public getAllPIDs(): number[] {
            return this.pcbs.map(pcb => pcb.PID);
        }

        // gets all PCBs (really to just display each process wiht teh shell command ps)
        public getAllPCBs(): PCB[]
        {
            return this.pcbs;
        }

        // clears all instances of memory
        public clearMemory(): void 
        {
            // clears memory through MemoryAccessor
            this.memoryAccessor.clearMemory();

            this.pcbs = []; // resets the PCBs array
        
            // marks all partitions as available
            this.availablePartitions.fill(true);
        
        }

    }
}