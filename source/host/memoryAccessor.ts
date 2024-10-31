/*
This is my memory accessor class. The importance of it is to provide access to the system memory
It talked with the memory class to read from and write to specific memory addresses
*/

module TSOS 
{
    export class MemoryAccessor 
    {
        private base: number;
        private limit: number;

        constructor(public memory: Memory) {}

        // sets the base and limit for the current process
        public setBounds(base: number, limit: number): void 
        {
            this.base = base;
            this.limit = limit;
        }

        // checks if the address is within the base and limit bounds
        private checkMemoryBounds(address: number): void 
        {
            if (address < this.base || address >= this.base + this.limit) {
                _Kernel.krnTrace(`Memory access violation at address ${address}`);
            }
        }

        // reads a byte from a specific memory address
        public read(address: number): number 
        {
            this.checkMemoryBounds(address);
            return this.memory.getByte(address);
        }

        // writes a byte to the designated address 
        public write(address: number, value: number): void 
        {
            this.checkMemoryBounds(address);
            this.memory.setByte(address, value);
        }
    }
}