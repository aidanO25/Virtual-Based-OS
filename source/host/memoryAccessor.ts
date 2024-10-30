/*
This is my memory accessor class. The importance of it is to provide access to the system memory
It talked with the memory class to read from and write to specific memory addresses
*/

module TSOS
{
    export class MemoryAccessor
    {
        private base: number = 0;  // Base address of current process
        private limit: number = 0; // Limit (end) address of current process

        constructor(public memory: Memory) {} // initializing memory and allows for this class to "talk" with the memory class
        

        // read a byte from a specific memory address
        public read(address: number): number
        {
            if(address >= 0 && address < this.memory.size)
            {
                return this.memory.getByte(address);
            }
        }

        // write a byte to the designated address
        public write(address: number, value: number): void
        {
            if(address >= 0 && address < this.memory.size)
            {
                this.memory.setByte(address, value);
            }
        }
    }
}