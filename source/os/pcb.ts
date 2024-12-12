/*
This calss is the Process Control Block. The purpose is to store the state of a process,
such as PC, Acc, and registers, which allows the OS to manage those processes
*/

module TSOS {
    export class PCB {
        public PID: number;  // process ID
        public PC: number;   // program Counter
        public ACC: number;  // accumulator
        public Xreg: number; // x Register
        public Yreg: number; // y Register
        public Zflag: number; // zero Flag
        public base: number; // base memory address
        public limit: number; // end of memory address
        public state: string; // process state 
        public location: string; // whether the process is on disk or not
        public priority: number; // process priority 

        // for tracking process turnaround time (thank you for offering +10)
        public arrivalTime: number;  // the time a process is added to the ready que
        public startTime: number | null = null; // when the process first gets the CPU  
        public completionTime: number | null = null; // when the process completes
        public cpuBurstTime: number = 0; // time incremented each cycle

        constructor(pid: number, base: number, limit: number, priority: number = 0, location: "memory" | "disk" = "memory") 
        {
            this.PID = pid;
            this.PC = base;  // (oh my god I forgot to change this to the base.... you wouldn't believe the headache)
            this.ACC = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.base = base;
            this.limit = limit;
            this.state = "Resident";  // default is resident (but can change to ready, running, or terminated)
            this.location = "0";  // default location is 0, but can be 1 or 2
            this.priority = priority;  // Default priority is 0

            // for turnaround and wait time caculation
            this.arrivalTime = Date.now();

            // keeping track where the process resides
            this.location = null;
        }
    }

    
}

