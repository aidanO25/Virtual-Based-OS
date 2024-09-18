/*
This is the memory manager class which is key for managing memory allocation for processes
It is in charge of allocating memory and returning a process id for each loaded program
I bet it will come in handy greatly when we are FORCED to run 3 programs simultaneously
*/
var TSOS;
(function (TSOS) {
    class MemoryManager {
        memoryAccessor;
        nextPID; // to keep track of the next available PID
        pcbs; // an array to store PCBs
        constructor(memoryAccessor) {
            this.memoryAccessor = memoryAccessor;
            this.nextPID = 0;
            this.pcbs = [];
        }
        // loads a program into memory and create a PCB for it
        loadProgram(program) {
            const base = 0; // because memory starts at 0
            const limit = program.length; // limit is the program size
            // making sure there is enough space in memory (idk if this is necessary but I'm sure a good thing to have)
            if (limit > this.memoryAccessor.memory.size) {
                throw new Error("Program exceeds memory size");
            }
            // loads the program into memory
            for (let i = 0; i < program.length; i++) {
                this.memoryAccessor.write(base + i, program[i]);
            }
            // creates a new PCB for the process
            const pcb = new TSOS.PCB(this.nextPID++, base, limit);
            this.pcbs.push(pcb); // ads the pcb to the list
            return pcb.PID; // returns the process ID
        }
        // retrieves a PCB by its PID
        getPCB(pid) {
            return this.pcbs.find(pcb => pcb.PID === pid);
        }
    }
    TSOS.MemoryManager = MemoryManager;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memoryManager.js.map