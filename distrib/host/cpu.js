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
        // indicates whether or not we use the scheduler or not (only when we use runall)
        schedulerFlag = false;
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
        // loads the current pcb into the cpu
        loadPCB(pcb) {
            this.pcb = pcb;
            // this makes sure the PC is within the process's memory bounds 
            if (pcb.PC < pcb.base || pcb.PC >= pcb.limit) {
                //_StdOut.putText(`Invalid PC value ${pcb.PC} for process ${pcb.PID}.`);
                this.isExecuting = false;
            }
            // changing the state to running once it's been loaded into the the cpu
            this.pcb.state = "Ready";
            this.PC = pcb.PC;
            this.Acc = pcb.ACC;
            this.Xreg = pcb.Xreg;
            this.Yreg = pcb.Yreg;
            this.Zflag = pcb.Zflag;
            this.memoryAccessor.setBounds(pcb.base, pcb.limit);
            // sets the start time as the first time the PCB is loaded
            // Moved this to after the values are set because the process really wouldn't have been loaded yet
            if (!pcb.startTime) {
                pcb.startTime = Date.now();
            }
            // starts cycling 
            //_StdOut.putText(`Loading PID ${pcb.PID}, setting PC to ${pcb.base}`);
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
        getCurrentPCB() {
            return this.pcb;
        }
        // this allows the cpu to fetch, decond, and execute
        cycle() {
            _Kernel.krnTrace('CPU cycle');
            // checks if memory accessor is initialized. I just got rid of hte error handler as this is just way simpler
            if (this.memoryAccessor && this.isExecuting) {
                this.pcb.state = "Running";
                // fetch
                const instruction = this.memoryAccessor.read(this.PC);
                //_StdOut.putText(`Executing PID ${this.pcb.PID}: Base - ${this.pcb.base}, Limit - ${this.pcb.limit}`); debug for out of bounds. I would uncomment this if you are looking to trouble shoot
                //_StdOut.advanceLine();
                // decode and execute
                this.executeInstruction(instruction);
                this.pcb.cpuBurstTime += 1; // for wait time calculation
                // this terminates a program if there are no other instrucitons to execute along with displaying turnaround time and wait time
                // It still stops on A9 regardless. comment this out to see it print inner1 (it can't go more than that because of instruction issues)
                if (!instruction) {
                    // changing the pcb state to terminated
                    this.pcb.state = "Terminated";
                    // sets the completion time to the current time
                    this.pcb.completionTime = Date.now();
                    // calculating turnaround and wait time
                    const turnaroundTime = this.pcb.completionTime - this.pcb.arrivalTime;
                    const waitTime = turnaroundTime - this.pcb.cpuBurstTime;
                    // displays turnaround time
                    _StdOut.advanceLine();
                    _StdOut.putText(`Process ${this.pcb.PID} - Turnaround Time: ${turnaroundTime} ms, Wait Time: ${waitTime} ms`);
                    _StdOut.advanceLine();
                    /// checks if there are any more processes to execute
                    if (this.schedulerFlag = true) {
                        _Kernel.initiateContextSwitch();
                    }
                }
                TSOS.Control.updateCpuStatus(); // updating the cpu status in the ui after each cycle
                TSOS.Control.updateMemoryDisplay(); // updates the memory status in the ui after each cycle
                // saves the current state of the pcb
                this.savePCB();
                TSOS.Control.updatePcbDisplay(); // updates the PCB display
                // increases the quantum counter
                if (this.schedulerFlag = true) {
                    _Scheduler.manageQuantum();
                }
                // checks if single step mode has been activated (i may also have to change this but it may be because of my instruction set)
                if (TSOS.Control.singleStepMode) {
                    // if so, execute one instruction and then stop execution
                    this.isExecuting = false;
                }
            }
        }
        // enable or disable the shceduler
        setScheduler(value) {
            this.schedulerFlag = value;
        }
        // these are the instructions from the 6502alan Machine language Instruction Set
        executeInstruction(instruction) {
            switch (instruction) {
                case 0xA9: //  load the accumulator with a constant
                    this.PC++; // move to the operand
                    this.Acc = this.memoryAccessor.read(this.PC); // Load constant into Acc
                    this.PC++; // move past the operand
                    break;
                case 0xAD: // load the accumulator from memory
                    this.PC++; // increments the pc to get the low byte of the mem address
                    const lowByte = this.memoryAccessor.read(this.PC);
                    this.PC++; // increments the pc to get the high byte of the memory address
                    const highByte = this.memoryAccessor.read(this.PC);
                    const address = (highByte << 8) | lowByte; // loads the value at the memory addrss into the accumulator
                    this.Acc = this.memoryAccessor.read(address);
                    this.PC++;
                    break;
                case 0x8D: // stores the accumulator in memory
                    this.PC++; // incrementing the pc to get the low byte of mem address
                    const storeLowByte = this.memoryAccessor.read(this.PC);
                    this.PC++; // increments the pc to get the high byte of mem address
                    const storeHighByte = this.memoryAccessor.read(this.PC);
                    const storeAddress = (storeHighByte << 8) | storeLowByte; // combines the low and high bytes to form the full mem address
                    this.memoryAccessor.write(storeAddress, this.Acc); // stores the accumulators value at the specified memory address
                    this.PC++;
                    break;
                case 0x6D: // add with carry
                    this.PC++; // increment the progam counter to get low byte of the mem address
                    const addLowByte = this.memoryAccessor.read(this.PC);
                    this.PC++; // increment the program counter to get the high byte of the mem address
                    const addHighByte = this.memoryAccessor.read(this.PC);
                    const addAddress = (addHighByte << 8) | addLowByte; // rad the value at the desired address and add it to the accumulator
                    const value = this.memoryAccessor.read(addAddress); // reads the value at the computed address and adds it to the accumulator
                    this.Acc += value;
                    this.PC++;
                    break;
                case 0xA2: // load the X register with a constant
                    this.PC++; // points to the operand
                    this.Xreg = this.memoryAccessor.read(this.PC); // loads the constant into the x reg
                    this.PC++;
                    break;
                case 0xAE: // load the X register from memory
                    this.PC++; // incrementing to get low byte of memory address
                    const xLowByte = this.memoryAccessor.read(this.PC);
                    this.PC++; // incrementing to get the high byte of memory address
                    const xHighByte = this.memoryAccessor.read(this.PC);
                    const xAddress = (xHighByte << 8) | xLowByte; // combines the low and high byte to form the full memory address
                    this.Xreg = this.memoryAccessor.read(xAddress); // leads the value from memory into the x register
                    this.PC++;
                    break;
                case 0xA0: // load the Y register with a constant
                    this.PC++; // points to the operand
                    this.Yreg = this.memoryAccessor.read(this.PC); // load the constant into the y register
                    this.PC++;
                    break;
                case 0xAC: // load the Y register from memory
                    this.PC++; // incrementing to get the low byte of memory address
                    const yLowByte = this.memoryAccessor.read(this.PC);
                    this.PC++; // incrementing to get the high byte of memory
                    const yHighByte = this.memoryAccessor.read(this.PC);
                    const yAddress = (yHighByte << 8) | yLowByte; // combines the low and high byte to form full mem address
                    this.Yreg = this.memoryAccessor.read(yAddress); // load the value from memory into the y reg
                    this.PC++;
                    break;
                case 0xEA: // no Operation
                    this.PC++; // just in incrementing the program counter
                    break;
                case 0x00: // break (System call) I assume we just stop executing and increment the program counter
                    this.PC++;
                    if (this.memoryAccessor.read(this.PC) === 0x00) {
                        this.PC--;
                        this.isExecuting = false;
                    }
                    break;
                case 0xEC: // compare a byte in memory to the X register
                    this.PC++; // increment the pc to get the low byte of the mem address
                    const cpxLowByte = this.memoryAccessor.read(this.PC);
                    this.PC++; // increment the pc to get the high byte of the mem address
                    const cpxHighByte = this.memoryAccessor.read(this.PC);
                    const cpxAddress = (cpxHighByte << 8) | cpxLowByte; // comparing the value in memory with the x reg and setting the Z flag 
                    const cpxValue = this.memoryAccessor.read(cpxAddress);
                    this.Zflag = (this.Xreg === cpxValue) ? 1 : 0;
                    this.PC++; // moves to the next operand
                    break;
                case 0xD0: // branch if Z flag is equal to 0
                    // increments the pc counter to get the branch offset 
                    this.PC++;
                    if (this.Zflag === 0) {
                        // if the z flag is 0, add the branch offset to the pc
                        const branchValue = this.memoryAccessor.read(this.PC);
                        this.PC = this.PC + branchValue;
                        alert(branchValue);
                    }
                    else {
                        // otherwise just skip the branch operand
                        this.PC++;
                    }
                    break;
                case 0xEE: // increment the value of a byte
                    this.PC++; // increments the pc to get the low byte of the memory add
                    const incLowByte = this.memoryAccessor.read(this.PC);
                    this.PC++;
                    // increments the pc to get the high byte of the memory add
                    const incHighByte = this.memoryAccessor.read(this.PC);
                    // combines the low and high byte to form the full memory address
                    const incAddress = (incHighByte << 8) | incLowByte;
                    let incValue = this.memoryAccessor.read(incAddress);
                    incValue++;
                    this.memoryAccessor.write(incAddress, incValue);
                    // increment the pc to move past the operand
                    this.PC++;
                    break;
                case 0xFF: // system call to output any data
                    if (this.Xreg === 1) {
                        _StdOut.putText(this.Yreg.toString()); // prints the integer value in Y register
                    }
                    else if (this.Xreg === 2) {
                        let address = this.Yreg; // starts at the memory address in Y reg
                        let char = '';
                        while ((char = String.fromCharCode(this.memoryAccessor.read(address))) !== '\0') {
                            _StdOut.putText(char); // output each ASCII character
                            address++; // move to the next memory location
                        }
                    }
                    else {
                        _StdOut.putText(`Unknown system call with Xreg: ${this.Xreg}`);
                        this.pcb.state = "Terminated";
                    }
                    this.PC++;
                    break;
                default:
                    _StdOut.advanceLine();
                    _StdOut.putText("error"); // deffinetly could put something better or debugging but it truly is an error
                    this.pcb.state = "Terminated";
                    this.isExecuting = false;
            }
        }
    }
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
//branch forward:  d0 03 a9 05 ea a9 07 00
// branch backward: a9 07 ea d0 fb ea 00
//# sourceMappingURL=cpu.js.map