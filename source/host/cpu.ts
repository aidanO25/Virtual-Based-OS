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

     module TSOS {

        export class Cpu {
    
            constructor(public PC: number = 0,
                        public Acc: number = 0,
                        public Xreg: number = 0,
                        public Yreg: number = 0,
                        public Zflag: number = 0,
                        private memoryAccessor: MemoryAccessor = null, // reference to MemoryAccessor
                        private pcb: PCB = null, // reference to the CURRENT PCB 
                        public isExecuting: boolean = false) {
    
            }
    
            public init(): void {
                this.PC = 0;
                this.Acc = 0;
                this.Xreg = 0;
                this.Yreg = 0;
                this.Zflag = 0;
                this.isExecuting = false;
            }

            // starts executing a process
            public loadPCB(pcb: PCB): void 
            {
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
            private savePCB(): void 
            {
                if(this.pcb)
                {
                    this.pcb.PC = this.PC;
                    this.pcb.ACC = this.Acc;
                    this.pcb.Xreg = this.Xreg;
                    this.pcb.Yreg = this.Yreg;
                    this.pcb.Zflag = this.Zflag;
                }
            }
    
            public cycle(): void {
                _Kernel.krnTrace('CPU cycle');

                // ensures that the memoryAccessor is properly initialized before trying to access it
                // I had AI help with the structure of this becaues it gave the idea to set up error handling because of issues with reading using the memoryAccessor
                if (this.memoryAccessor) 
                {
                    
                    try 
                    {
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
                else
                {
                    console.error("MemoryAccessor is not initialized.");
                    this.isExecuting = false;
                }
            }
    
            // method for executing
            private executeInstruction(instruction: number): void {
                switch (instruction) {
                    // this is the 6502 tsiraM instruction set
                    case 0xA9: // load the accumulator
                        this.Acc = this.memoryAccessor.read(this.PC + 1);
                        this.PC++;
                        break;

                    case 0xAD: // load the accumulator from memory
                        const addr = this.memoryAccessor.read(this.PC + 1);
                        this.Acc = this.memoryAccessor.read(addr);
                        this.PC++;
                        break;
                    
                    case 0x8D: //store the accumulator in memory 
                        const storeAddr = this.memoryAccessor.read(this.PC + 1);
                        this.PC++;
                        break;
                    
                    case 0x8A: //transfer x to teh accumulator
                        this.Acc = this.Xreg;
                        break;
                    
                    case 0x98: //transfer y to accumulator
                        this.Acc = this.Yreg;
                        break;
                    
                    case 0x6D: // add with carry
                        const adcAddr = this.memoryAccessor.read(this.PC + 1);
                        this.Acc += this.memoryAccessor.read(adcAddr);
                        this.PC++;
                        break;

                    case 0xA2: //  load x with a constant
                        this.Xreg = this.memoryAccessor.read(this.PC + 1);
                        this.PC++;
                        break;

                    case 0xAE: // load x from memory
                        const xAddr = this.memoryAccessor.read(this.PC + 1)
                        this.Xreg = this.memoryAccessor.read(xAddr);
                        this.PC++;
                        break;
                    
                    case 0xAA: // transfer accumulator to x
                        this.Xreg = this.Acc;
                        this.PC++;
                        break;

                    case 0xA0: // load y with a constant
                        this.Yreg = this.memoryAccessor.read(this.PC + 1);
                        this.PC++
                        break;

                    case 0xAC: // load y from memory
                        const yAddr = this.memoryAccessor.read(this.PC + 1);
                        this.Yreg = this.memoryAccessor.read(yAddr);
                        this.PC++;
                        break;

                    case 0xA8: // transfer th accumulator to y
                        this.Yreg = this.Acc;
                        this.PC++;
                        break;

                    case 0xEA: // no operation
                        this.PC++; // ID RATHER NOT ETERNALLY LOOP
                        break;

                    case 0x00: // break
                        this.isExecuting = false;
                        break;

                    case 0xEC: // compares a byte in memory to x
                        const cmpAddr = this.memoryAccessor.read(this.PC + 1);
                        const cmpValue = this.memoryAccessor.read(cmpAddr);
                        this.Zflag = (this.Yreg === cmpValue) ? 1 : 0; 
                        this.PC++;
                        break;

                    case 0xD0: // branch if Z flag is 0
                        const branchAddr = this.memoryAccessor.read(this.PC + 1);
                        if(this.Zflag === 0 )
                        {
                            this.PC = branchAddr;
                        }
                        else
                        {
                            this.PC++;
                        }
                        break;

                    case 0xEE: // incrememnt memory
                        const incAddr = this.memoryAccessor.read(this.PC + 1);
                        let value = this.memoryAccessor.read(incAddr);
                        value++;
                        this.memoryAccessor.write(incAddr, value);
                        this.PC++;
                        break;

                    default:
                        console.error(`Unknown instruction: ${instruction.toString(16)}`);
                        this.isExecuting = false; // Stop execution on unknown instruction
                        break;

    
                }
            }    
        }
    }
    