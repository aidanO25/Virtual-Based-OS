/* ------------
     Console.ts

     The OS Console - stdIn and stdOut by default.
     Note: This is not the Shell. The Shell is the "command line interface" (CLI) or interpreter for this console.
     ------------ */
var TSOS;
(function (TSOS) {
    class Console {
        currentFont;
        currentFontSize;
        currentXPosition;
        currentYPosition;
        buffer;
        // variables to store command history
        commandHistory = [];
        historyIndex = -1;
        constructor(currentFont = _DefaultFontFamily, currentFontSize = _DefaultFontSize, currentXPosition = 0, currentYPosition = _DefaultFontSize, buffer = "") {
            this.currentFont = currentFont;
            this.currentFontSize = currentFontSize;
            this.currentXPosition = currentXPosition;
            this.currentYPosition = currentYPosition;
            this.buffer = buffer;
        }
        init() {
            this.clearScreen();
            this.resetXY();
        }
        clearScreen() {
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        }
        resetXY() {
            this.currentXPosition = 0;
            this.currentYPosition = this.currentFontSize;
        }
        handleInput() {
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
                else if (chr === String.fromCharCode(8)) {
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
        putText(text) {
            /*  My first inclination here was to write two functions: putChar() and putString().
                Then I remembered that JavaScript is (sadly) untyped and it won't differentiate
                between the two. (Although TypeScript would. But we're compiling to JavaScipt anyway.)
                So rather than be like PHP and write two (or more) functions that
                do the same thing, thereby encouraging confusion and decreasing readability, I
                decided to write one function and use the term "text" to connote string or char.
            */
            if (text !== "") {
                // Draw the text at the current X and Y coordinates.
                _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);
                // Move the current X position.
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                this.currentXPosition = this.currentXPosition + offset;
            }
        }
        advanceLine() {
            this.currentXPosition = 0;
            /*
             * Font size measures from the baseline to the highest point in the font.
             * Font descent measures from the baseline to the lowest point in the font.
             * Font height margin is extra spacing between the lines.
             */
            this.currentYPosition += _DefaultFontSize +
                _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                _FontHeightMargin;
            // checks if the current Y position goes past the canvas length
            if (this.currentYPosition > _Canvas.height - _DefaultFontSize) {
                this.handleScrolling();
            }
        }
        // enabling backspace
        handleBackspace() {
            if (this.buffer.length > 0) // checking to see if there are even characters in the buffer
             {
                var lastChar = this.buffer[this.buffer.length - 1];
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, lastChar); // measuring the width of the last character, needed AI help with this idea
                this.currentXPosition -= offset;
                // clearing a slightly larger area to account for descenders (also got some AI help with this because for characters such as g for j, a small bit of the bottom portion wouldn't be deleted)
                _DrawingContext.clearRect(this.currentXPosition, this.currentYPosition - this.currentFontSize, offset, this.currentFontSize + _FontHeightMargin + 10);
                this.buffer = this.buffer.slice(0, -1); // removing the last character
            }
        }
        // enabling tab completion
        handleTabCompletion() {
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
        clearLine() {
            this.currentXPosition = 0;
            _DrawingContext.clearRect(0, this.currentYPosition - this.currentFontSize, _Canvas.width, this.currentFontSize + _FontHeightMargin);
        }
        // displays the previous command 
        showPreviousCommand() {
            if (this.historyIndex > 0) { // chekcs to see if there is a previous command
                this.historyIndex--;
                this.buffer = this.commandHistory[this.historyIndex]; // gets the previous command
                this.clearLine();
                this.putText(this.buffer);
            }
        }
        // displays the next command
        showNextCommand() {
            if (this.historyIndex < this.commandHistory.length - 1) { // checks if there is a next command
                this.historyIndex++;
                this.buffer = this.commandHistory[this.historyIndex]; // gets the next command 
                this.clearLine();
                this.putText(this.buffer);
            }
            else {
                this.historyIndex = this.commandHistory.length;
                this.buffer = "";
                this.clearLine();
            }
        }
        handleScrolling() {
            const imageData = _DrawingContext.getImageData(0, _DefaultFontSize + _FontHeightMargin, _Canvas.width, _Canvas.height - (_DefaultFontSize + _FontHeightMargin));
            this.clearScreen();
            _DrawingContext.putImageData(imageData, 0, 0); // putts the image data back at the top with it moved up one line
            this.currentYPosition = _Canvas.height - (_DefaultFontSize + _FontHeightMargin); // reset the current Y to the bottom of the canvas
        }
    }
    TSOS.Console = Console;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=console.js.map