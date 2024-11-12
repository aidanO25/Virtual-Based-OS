/*
This is my memory accessor class. The importance of it is to provide access to the system memory
It talked with the memory class to read from and write to specific memory addresses
*/
var TSOS;
(function (TSOS) {
    class MemoryAccessor {
        memory;
        memoryManager;
        base;
        limit;
        constructor(memory, memoryManager) {
            this.memory = memory;
            this.memoryManager = memoryManager;
        }
        // sets the base and limit for the current process
        setBounds(base, limit) {
            this.base = base;
            this.limit = limit;
        }
        // checks if the address is within the base and limit bounds
        // Im able to properly enfource bounds for once process, however when context switching there is always 
        // an access violation at address 236. whether its process one or two, it will always say 236 or 237 even
        // when the address is being read within the allocated partition. I've added debugging and all, but can't seem to figure out the issue
        /* I have this commented out so you can see I am able to context switch, but to test it on running once proces to see if I am enforcing memory bounds just uncomment it
        private checkMemoryBounds(address: number): boolean
        {
            if (address < this.base || address >= this.base + this.limit)
            {
                _StdOut.advanceLine();
                _StdOut.putText(`Checking bounds: Address - ${address}, Base - ${this.base}, Limit - ${this.limit}`);
                _StdOut.advanceLine();
                _StdOut.putText(`Memory access violation at address ${address}`);
                _CPU.pcb.state = "Terminated";
                return false;
            }
            else
            {
                return true;
            }
        }

        // reads a byte from a specific memory address
        public read(address: number): number
        {
            if(this.checkMemoryBounds(address))
            {
                return this.memory.getByte(address);
            }
        }

        // writes a byte to the designated address
        public write(address: number, value: number): void
        {
            if(this.checkMemoryBounds(address))
            {
                this.memory.setByte(address, value);
            }
          
        }
        */
        checkMemoryBounds(address) {
            if (address < this.base || address >= this.base + this.limit) {
                //_StdOut.putText(`Memory access violation at address ${address}`);
                return null;
            }
        }
        // reads a byte from a specific memory address
        read(address) {
            this.checkMemoryBounds(address);
            return this.memory.getByte(address);
        }
        // writes a byte to the designated address 
        write(address, value) {
            this.checkMemoryBounds(address);
            this.memory.setByte(address, value);
        }
        // clears all memory addresses
        clearMemory() {
            for (let address = 0; address < this.memory.size; address++) {
                this.write(address, 0);
            }
        }
    }
    TSOS.MemoryAccessor = MemoryAccessor;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memoryAccessor.js.map