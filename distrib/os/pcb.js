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
        constructor(pid, base, limit) {
            this.PID = pid;
            this.PC = 0; // Initialized to the start of the program
            this.ACC = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.base = base;
            this.limit = limit;
        }
    }
    TSOS.PCB = PCB;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=pcb.js.map