/* ------------
     Console.ts

     The OS Console - stdIn and stdOut by default.
     Note: This is not the Shell. The Shell is the "command line interface" (CLI) or interpreter for this console.
     ------------ */

module TSOS {

    export class Console {

        // variables to store command history
        private commandHistory: string[] = [];
        private historyIndex: number =-1;

        constructor(public currentFont = _DefaultFontFamily,
                    public currentFontSize = _DefaultFontSize,
                    public currentXPosition = 0,
                    public currentYPosition = _DefaultFontSize,
                    public buffer = "") {
        }

        public init(): void {
            this.clearScreen();
            this.resetXY();
        }

        public clearScreen(): void {
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        }

        public resetXY(): void {
            this.currentXPosition = 0;
            this.currentYPosition = this.currentFontSize;
        }

        public handleInput(): void {
            while (_KernelInputQueue.getSize() > 0) {
                // Get the next character from the kernel input queue.
                var chr = _KernelInputQueue.dequeue();
                // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
                if (chr === String.fromCharCode(13)) { // the Enter key
                    // putting the previous command into the buffer if the arrow key is used
                    this.commandHistory.push(this.buffer);
                    this.historyIndex = this.commandHistory.length;
                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...
                    _OsShell.handleInput(this.buffer);
                    // ... and reset our buffer.
                    this.buffer = "";
                } 
                // backspace handling
                else if(chr === String.fromCharCode(8)) {
                    this.handleBackspace();
                }
                // tab completion
                else if (chr === String.fromCharCode(9)) { 
                    this.handleTabCompletion();
                }
                // up arrow to show previous command
                else if (chr === 38) {
                    this.showPreviousCommand();
                }
                // down arrow to show next command
                else if (chr === 40) {
                    this.showNextCommand();
                }
                else {
                    // This is a "normal" character, so ...
                    // ... draw it on the screen...
                    this.putText(chr);
                    // ... and add it to our buffer.
                    this.buffer += chr;
                }
                // TODO: Add a case for Ctrl-C that would allow the user to break the current program.
            }
        }

        public putText(text: string): void 
        {

            if (text !== "") {
                const words = text.split(" ");  // splits text into words to handle wrapping properly
        
                for (let i = 0; i < words.length; i++) {
                    const word = words[i];
                    const wordWidth = _DrawingContext.measureText(this.currentFont, this.currentFontSize, word);
        
                    // checks if the word fits on the current line, if it doesn't this advances the cursor to the next line
                    if (this.currentXPosition + wordWidth > _Canvas.width) {
                        this.advanceLine();
                    }
        
                    // draws the word
                    _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, word);
                    this.currentXPosition += wordWidth;  // Update X position for the next word
        
                    // AddS space after word (if it's not the last word)
                    if (i < words.length - 1) {
                        const spaceWidth = _DrawingContext.measureText(this.currentFont, this.currentFontSize, " ");
                        this.currentXPosition += spaceWidth;
                    }
                }
            }
        }

        public advanceLine(): void {
            this.currentXPosition = 0;  // ResetS X to the beginning of the new line
            this.currentYPosition += this.currentFontSize + _FontHeightMargin;  // Move Y down by the font size + margin
        
            // Handle scrolling if the current Y position exceeds the canvas height
            if (this.currentYPosition > _Canvas.height - this.currentFontSize) {
                this.handleScrolling();
            }
        }

        public handleBackspace(): void 
        {
            if (this.buffer.length > 0) 
            {
                const lastChar = this.buffer[this.buffer.length - 1];
                const lastCharWidth = _DrawingContext.measureText(this.currentFont, this.currentFontSize, lastChar);
        
                // If we're at the start of the line, move to the previous line
                if (this.currentXPosition - lastCharWidth < 0) 
                {
                    this.moveToPreviousLine(); 
                }
        
                // clears the spot where the character was drawn
                _DrawingContext.clearRect(
                    this.currentXPosition - lastCharWidth,
                    this.currentYPosition - this.currentFontSize,
                    lastCharWidth,
                    this.currentFontSize + _FontHeightMargin
                );
        
                // moves the cursor back by the width of the last character
                this.currentXPosition -= lastCharWidth;
        
                // removes the last character from the buffer
                this.buffer = this.buffer.slice(0, -1);
            }
        }
        
        // moves to the previous line for char deletion
        private moveToPreviousLine(): void 
        {
            // moves the cursor's y up to the previous line
            this.currentYPosition -= this.currentFontSize + _FontHeightMargin;
        
            // ses the cursor's x to the end of the previous line 
            this.currentXPosition = _Canvas.width;
        }

        // enabling tab completion
        public handleTabCompletion(): void {
            const commands = _OsShell.commandList.map(cmd => cmd.command); // this takes in the list of available shell commands. I had help with both this line and the one below to make a list of commands and filtering through them. See commit description
            const matches = commands.filter(cmd => cmd.startsWith(this.buffer));
            // checks if there is a command that matches the partically typed input and if so it adds it to the buffer
            if (matches.length === 1) {
                this.buffer = matches[0];
                this.clearLine();
                this.putText(this.buffer);
            }
        }

        // clear line makes sure the command is displayed correctly, rather than just adding onto the current characters
        public clearLine(): void {
            this.currentXPosition = 0;
            _DrawingContext.clearRect(0, this.currentYPosition - this.currentFontSize, _Canvas.width, this.currentFontSize + _FontHeightMargin);
        }

        // displays the previous command 
        private showPreviousCommand(): void {
            if (this.historyIndex > 0) { // chekcs to see if there is a previous command
                this.historyIndex--;
                this.buffer = this.commandHistory[this.historyIndex]; // gets the previous command
                this.clearLine();
                this.putText(this.buffer);
            }
        }

        // displays the next command
        private showNextCommand(): void {
            if (this.historyIndex < this.commandHistory.length - 1) { // checks if there is a next command
                this.historyIndex++;
                this.buffer = this.commandHistory[this.historyIndex]; // gets the next command 
                this.clearLine();
                this.putText(this.buffer);
            } else {
                this.historyIndex = this.commandHistory.length;
                this.buffer = "";
                this.clearLine();
            }
        }

        // scrolls up. captures the image data, clears the screen, and re-pasts it at the top
        private handleScrolling(): void {
            // variable to save the image dta
            const imageData = _DrawingContext.getImageData(0,_DefaultFontSize + _FontHeightMargin, _Canvas.width, _Canvas.height - (_DefaultFontSize + _FontHeightMargin));
            this.clearScreen();
             // putts the image data back at the top with it moved up one line
            _DrawingContext.putImageData(imageData, 0, 0);
            // resets the current position
            this.currentYPosition = _Canvas.height - (_DefaultFontSize + _FontHeightMargin); // reset the current Y to the bottom of the canvas
        }

        public shellbsod(args: string[]) {
            const img = new Image();
            img.src = 'error.png'; // Replace with the actual path to your image
            img.onload = function() {
                _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height); // Clear the canvas
                _DrawingContext.drawImage(img, 0, 0, _Canvas.width, _Canvas.height); // Draw the image on the canvas
            };
        }
    }
 }