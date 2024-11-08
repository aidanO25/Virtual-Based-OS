/*
    This is my scheduler class which handles scheduling dispatching, and more
    */

module TSOS 
{
    export class Scheduler 
    {
        private quantumCounter: number = 0; // tracks the cycles 
        private currentProcessIndex: number = 0; // tracks the index of the current process in the ready queue

        constructor(private memoryManager: MemoryManager, private cpu: Cpu) { }

        // starts/continues scheduling using round robin scheduling 
        public scheduleNextProcess(): void 
        {
            // ensures there are processes in the queue
            if (this.memoryManager.readyQueue.length === 0) 
            {
                _StdOut.putText("No processes available to schedule.");
                return;
            }

            const nextPCB = this.memoryManager.readyQueue[this.currentProcessIndex]; // getes the next process to execute based on the index of the current process within the ready queue
            this.dispatchProcess(nextPCB); //passes the next sleected process to the dispatcher to handle the context switch
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

        // manages the quantum counter and triggers a context switch when the quantum is reached
        // this is how the scheduler interacts with the cpu 
        public manageQuantum(): void 
        {
            this.quantumCounter++;
            if (this.quantumCounter >= 6) 
            {
                this.quantumCounter = 0; // resetting the quantum counter
                this.currentProcessIndex = (this.currentProcessIndex + 1) % this.memoryManager.readyQueue.length;
                // _StdOut.putText("Quantum reached. Switching process..."); just debug
                this.scheduleNextProcess(); // switches to the next process
            }
        }
    }
}