/*
This calss is the Process Control Block. The purpose is to store the state of a process,
such as PC, Acc, and registers, which allows the OS to manage those processes
*/
var TSOS;
(function (TSOS) {
    class PCB {
        PID; // process ID
        PC; // program Counter
        ACC; // accumulator
        Xreg; // x Register
        Yreg; // y Register
        Zflag; // zero Flag
        base; // base memory address
        limit; // end of memory address
        state; // process state 
        location; // process location
        priority; // process priority 
        // for tracking process turnaround time (thank you for offering +10)
        arrivalTime; // the time a process is added to the ready que
        startTime = null; // when the process first gets the CPU  
        completionTime = null; // when the process completes
        cpuBurstTime = 0; // time incremented each cycle
        // the following is to keep track of whether a process is in memory or swapped out
        memOrDisk;
        constructor(pid, base, limit, priority = 0, location = "memory") {
            this.PID = pid;
            this.PC = base; // (oh my god I forgot to change this to the base.... you wouldn't believe the headache)
            this.ACC = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.base = base;
            this.limit = limit;
            this.state = "Resident"; // default is resident (but can change to ready, running, or terminated)
            this.location = "0"; // default location is 0, but can be 1 or 2
            this.priority = priority; // Default priority is 0
            // for turnaround and wait time caculation
            this.arrivalTime = Date.now();
            // keeping track where the process resides
            this.memOrDisk = null;
        }
    }
    TSOS.PCB = PCB;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=pcb.js.map