/* ------------
     CPU.ts

     Routines for the host CPU simulation, NOT for the OS itself.
     In this manner, it's A LITTLE BIT like a hypervisor,
     in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
     that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
     TypeScript/JavaScript in both the host and client environments.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */
var TSOS;
(function (TSOS) {
    class Cpu {
        PC;
        Acc;
        Xreg;
        Yreg;
        Zflag;
        memoryAccessor;
        pcb;
        isExecuting;
        constructor(PC = 0, Acc = 0, Xreg = 0, Yreg = 0, Zflag = 0, memoryAccessor = null, // reference to MemoryAccessor
        pcb = null, // reference to the CURRENT PCB 
        isExecuting = false) {
            this.PC = PC;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.Zflag = Zflag;
            this.memoryAccessor = memoryAccessor;
            this.pcb = pcb;
            this.isExecuting = isExecuting;
        }
        init() {
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
        }
        // starts executing a process
        loadPCB(pcb) {
            // loading the pCB values into the CPU
            this.pcb = pcb;
            this.PC = pcb.PC;
            this.Acc = pcb.ACC;
            this.Xreg = pcb.Xreg;
            this.Yreg = pcb.Yreg;
            this.Zflag = pcb.Zflag;
            this.isExecuting = true;
        }
        // saves the current state of the CPU back into the PCB
        savePCB() {
            if (this.pcb) {
                this.pcb.PC = this.PC;
                this.pcb.ACC = this.Acc;
                this.pcb.Xreg = this.Xreg;
                this.pcb.Yreg = this.Yreg;
                this.pcb.Zflag = this.Zflag;
            }
        }
        cycle() {
            _Kernel.krnTrace('CPU cycle');
            // ensures that the memoryAccessor is properly initialized before trying to access it
            // I had AI help with the structure of this becaues it gave the idea to set up error handling because of issues with reading using the memoryAccessor
            if (this.memoryAccessor) {
                try {
                    const instruction = this.memoryAccessor.read(this.PC); // fetches the instruction from memory 
                    this.executeInstruction(instruction); // decodes, then executes the instruction
                    this.PC++; // increases the program counter
                    // after executing, save the current CPU state back to the PCB
                    this.savePCB();
                }
                catch (error) {
                    console.error(`Error during CPU cycle: ${error.message}`); // shows what the error is
                    this.isExecuting = false; // stops executing on the erorr
                }
            }
            else {
                console.error("MemoryAccessor is not initialized.");
                this.isExecuting = false;
            }
        }
        // method for executing
        executeInstruction(instruction) {
            switch (instruction) {
                case 0xA9: // load the accumulator
                    const value = this.memoryAccessor.read(this.PC + 1);
                    this.Acc = value;
                    this.PC++;
                    break;
                // add more instructions
                default:
                    console.error(`Unknown instruction: ${instruction.toString(16)}`);
                    this.isExecuting = false;
                    break;
            }
        }
    }
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=cpu.js.map