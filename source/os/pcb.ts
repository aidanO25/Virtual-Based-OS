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

        constructor(pid: number, base: number, limit: number) {
            this.PID = pid;
            this.PC = 0;  // Initialized to the start of the program
            this.ACC = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.base = base;
            this.limit = limit;
        }
    }
}