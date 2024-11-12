// this is the scheduler class used by the kernel to interact with the cpu to context switch based on the quantum using round robin scheduling 

module TSOS 
{
    export class Scheduler 
    {
        private quantum: number = 6;
        private quantumCounter: number = 0;
        private currentProcessIndex: number = 0;

        constructor(private memoryManager: MemoryManager) { }

        // sets the quantum by use of the shell command
        public setQuantum(newQuantum: number): void 
        {
            this.quantum = newQuantum;
        }
        
        // ensures that a context switch only occures if the quantum is reached
        public manageQuantum(): void 
        {
            this.quantumCounter++;
            if (this.quantumCounter >= this.quantum) 
            {
                this.quantumCounter = 0;
                _Kernel.initiateContextSwitch(); 
            }
        }

        // gets the next process in the queue
        public getNextProcess(): PCB | null 
        {
            if (this.memoryManager.readyQueue.length === 0) return null;

            // ensures that there must be processes in the ready queue
            while (this.memoryManager.readyQueue.length > 0) 
            {
                const nextPCB = this.memoryManager.readyQueue[this.currentProcessIndex]; // gets the next process from the queue
                if (nextPCB.state !== "Terminated") {
                    this.currentProcessIndex = (this.currentProcessIndex + 1) % this.memoryManager.readyQueue.length; // I had chat help comming up with the logic for this
                    return nextPCB;
                } 
                else
                {
                    // removes it from the list and gets the index of the current process
                    this.memoryManager.readyQueue.splice(this.currentProcessIndex, 1); 
                    this.currentProcessIndex %= this.memoryManager.readyQueue.length;
                }
            }
            return null;
        }
    }
}