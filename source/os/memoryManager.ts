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

        constructor(memoryAccessor: MemoryAccessor) {
            this.memoryAccessor = memoryAccessor;
            this.nextPID = 0;
            this.pcbs = [];
        }

        // loads a program into memory and create a PCB for it
        public loadProgram(program: number[]): number
        {
            const base = 0; // because memory starts at 0
            const limit = program.length; // limit is the program size

            // making sure there is enough space in memory (idk if this is necessary but I'm sure a good thing to have)
            if(limit > this.memoryAccessor.memory.size)
            {
                throw new Error("Program exceeds memory size");
            }

            // loads the program into memory
            for(let i = 0; i < program.length; i++)
            {
                this.memoryAccessor.write(base + i, program[i]);
            }

            // creates a new PCB for the process
            const pcb = new PCB(this.nextPID++, base, limit);
            this.pcbs.push(pcb); // ads the pcb to the list

            return pcb.PID; // returns the process ID
        }

        // retrieves a PCB by its PID
        public getPCB(pid: number): PCB | undefined
        {
            return this.pcbs.find(pcb => pcb.PID === pid);
        }

    }
}