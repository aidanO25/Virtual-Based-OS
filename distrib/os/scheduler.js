// this is the scheduler class used by the kernel to interact with the cpu to context switch based on the quantum using round robin scheduling 
var TSOS;
(function (TSOS) {
    class Scheduler {
        memoryManager;
        quantum = 6;
        quantumCounter = 0;
        currentProcessIndex = 0;
        cpu;
        constructor(memoryManager) {
            this.memoryManager = memoryManager;
        }
        // sets the quantum by use of the shell command
        setQuantum(newQuantum) {
            this.quantum = newQuantum;
        }
        // ensures that a context switch only occures if the quantum is reached
        manageQuantum() {
            this.quantumCounter++;
            if (this.quantumCounter >= this.quantum) {
                this.quantumCounter = 0;
                _Kernel.initiateContextSwitch();
            }
        }
        // gets the next process in the queue
        getNextProcess() {
            if (this.memoryManager.readyQueue.length === 0)
                return null;
            // ensures that there must be processes in the ready queue
            while (this.memoryManager.readyQueue.length > 0) {
                const nextPCB = this.memoryManager.readyQueue[this.currentProcessIndex]; // gets the next process from the queue
                // if the next process is on the disk, swap it out
                if (nextPCB.location === "disk") {
                    _StdOut.putText("shit is on disk");
                    this.memoryManager.swapProcess(nextPCB);
                    _StdOut.putText("swapped");
                }
                if (nextPCB.state !== "Terminated") {
                    this.currentProcessIndex = (this.currentProcessIndex + 1) % this.memoryManager.readyQueue.length; // I had chat help comming up with the logic for this
                    return nextPCB;
                }
                else {
                    // removes it from the list and gets the index of the current process
                    nextPCB.state = "Terminated";
                    this.memoryManager.readyQueue.splice(this.currentProcessIndex, 1);
                    this.currentProcessIndex %= this.memoryManager.readyQueue.length;
                }
            }
            return null;
        }
    }
    TSOS.Scheduler = Scheduler;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=scheduler.js.map