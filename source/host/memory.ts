// This file will serve as the memory section of my "computer"
module TSOS
{
    export class Memory 
    {
        public memoryArray: number[]; // Array representing the memory space
        public size: number;

        constructor(size: number = 768) 
        {
            this.size = size; // duh
            this.memoryArray = new Array(this.size).fill(0); // im not sure what brain fart i was having, but this is not the initialization of memory
        }

        // method to get a byte FROM memory
        public getByte(address: number): number 
        {
            return this.memoryArray[address];
        }

        // method to set a byte IN memory
        public setByte(address: number, value: number): void 
        {
            this.memoryArray[address] = value;
        }

    }
}