/*
    This is my scheduler class which handles scheduling dispatching, and more
    */
var TSOS;
(function (TSOS) {
    class Scheduler {
        memoryManager;
        cpu;
        quantumCounter = 0; // tracks the cycles 
        currentProcessIndex = 0; // tracks the index of the current process in the ready queue
        constructor(memoryManager, cpu) {
            this.memoryManager = memoryManager;
            this.cpu = cpu;
        }
        // starts/continues scheduling using round robin scheduling 
        scheduleNextProcess() {
            // ensures there are processes in the queue
            if (this.memoryManager.readyQueue.length === 0) {
                _StdOut.putText("No processes available to schedule.");
                return;
            }
            const nextPCB = this.memoryManager.readyQueue[this.currentProcessIndex]; // getes the next process to execute based on the index of the current process within the ready queue
            this.dispatchProcess(nextPCB); //passes the next sleected process to the dispatcher to handle the context switch
        }
        // dispatches a process to the CPu
        dispatchProcess(pcb) {
            if (this.cpu.pcb) {
                this.cpu.savePCB();
                if (this.cpu.pcb.state !== "Terminated") {
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
        manageQuantum() {
            this.quantumCounter++;
            if (this.quantumCounter >= 6) {
                this.quantumCounter = 0; // resetting the quantum counter
                this.currentProcessIndex = (this.currentProcessIndex + 1) % this.memoryManager.readyQueue.length;
                // _StdOut.putText("Quantum reached. Switching process..."); just debug
                this.scheduleNextProcess(); // switches to the next process
            }
        }
    }
    TSOS.Scheduler = Scheduler;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=scheduler.js.map