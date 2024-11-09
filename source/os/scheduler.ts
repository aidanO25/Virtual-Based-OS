/*
    This is my scheduler class which handles scheduling dispatching, and more
    */

module TSOS 
{
    export class Scheduler 
    {
        private quantum: number = 6; // default quantum
        private quantumCounter: number = 0; // tracks the cycles 
        private currentProcessIndex: number = 0; // tracks the index of the current process in the ready queue

        constructor(private memoryManager: MemoryManager, private cpu: Cpu) { }

        // lets the user set the quantum by shell command
        public setQuantum(newQuantum: number)
        {
            this.quantum = newQuantum;
        }

        // manages the quantum counter and triggers a context switch when the quantum is reached
        // this is how the scheduler interacts with the cpu 
        public manageQuantum(): void 
        {
            this.quantumCounter++;
            if (this.quantumCounter >= this.quantum) 
            {
                this.quantumCounter = 0; // resetting the quantum counter
                this.currentProcessIndex = (this.currentProcessIndex + 1) % this.memoryManager.readyQueue.length;
                // _StdOut.putText("Quantum reached. Switching process..."); just debug
                this.scheduleNextProcess(); // switches to the next process
            }
        }

        // starts/continues scheduling using round robin scheduling 
        // I had slight chat help with comming up with a process of iterating through the readyQueue 
        public scheduleNextProcess(): void 
        {
            // advances to the next non-terminated process in the ready queue
            while (this.memoryManager.readyQueue.length > 0) 
            {
                const nextPCB = this.memoryManager.readyQueue[this.currentProcessIndex];
        
                // if the process is terminated, remove it from the queue and continue
                if (nextPCB.state === "Terminated") 
                {
                    this.memoryManager.readyQueue.splice(this.currentProcessIndex, 1);
        
                    // if removing the terminated process leaves no processes, stop the CPU
                    // this is really for a case in which there is only one process in the queue and kill<pid> is called 
                    if (this.memoryManager.readyQueue.length === 0) 
                    {
                        _StdOut.putText("All processes terminated. Halting CPU.");
                        _CPU.isExecuting = false;
                    }
        
                    // adjusts the curentProcessIndex to stay within bounds of the modified queue 
                    this.currentProcessIndex %= this.memoryManager.readyQueue.length;
                } 
                else 
                {
                    this.dispatchProcess(nextPCB);
                    return;
                }
            }
        
            // if no runnable processe are found stop the cpu
            _StdOut.putText("No runnable processes left. Halting CPU.");
            _CPU.isExecuting = false;
        }

        // dispatches a process to the CPu
        private dispatchProcess(pcb: PCB): void 
        {
            if (this.cpu.pcb) 
            {
                this.cpu.savePCB();
                if (this.cpu.pcb.state !== "Terminated") 
                {
                    this.cpu.pcb.state = "Waiting";
                }
            }
            this.cpu.loadPCB(pcb);
            pcb.state = "Executing";
            this.quantumCounter = 0; // resets the quantum counter
            this.cpu.isExecuting = true;

            TSOS.Control.updatePcbDisplay(); // updates the PCB display
        }

    }
}