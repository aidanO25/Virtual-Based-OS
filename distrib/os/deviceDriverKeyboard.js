/* ----------------------------------
   DeviceDriverKeyboard.ts

   The Kernel Keyboard Device Driver.
   ---------------------------------- */
var TSOS;
(function (TSOS) {
    // Extends DeviceDriver
    class DeviceDriverKeyboard extends TSOS.DeviceDriver {
        constructor() {
            // Override the base method pointers.
            // The code below cannot run because "this" can only be
            // accessed after calling super.
            // super(this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
            // So instead...
            super();
            this.driverEntry = this.krnKbdDriverEntry;
            this.isr = this.krnKbdDispatchKeyPress;
        }
        krnKbdDriverEntry() {
            // Initialization routine for this, the kernel-mode Keyboard Device Driver.
            this.status = "keyboard loaded";
            // More?
        }
        krnKbdDispatchKeyPress(params) {
            // Parse the params.  TODO: Check that the params are valid and osTrapError if not.
            var keyCode = params[0];
            var isShifted = params[1];
            _Kernel.krnTrace("Key code:" + keyCode + " shifted:" + isShifted);
            var chr = "";
            // Check to see if we even want to deal with the key that was pressed.
            if ((keyCode >= 65) && (keyCode <= 90)) { // letter
                if (isShifted === true) {
                    chr = String.fromCharCode(keyCode); // Uppercase A-Z
                }
                else {
                    chr = String.fromCharCode(keyCode + 32); // Lowercase a-z
                }
                // TODO: Check for caps-lock and handle as shifted if so.
                _KernelInputQueue.enqueue(chr);
            }
            else if ((keyCode >= 48) && (keyCode <= 57)) { // digits and symbols
                if (isShifted) { // checks to see if the shift key is pressed to then print the symbol
                    switch (keyCode) {
                        case 48:
                            chr = ')';
                            break;
                        case 49:
                            chr = '!';
                            break;
                        case 50:
                            chr = '@';
                            break;
                        case 51:
                            chr = '#';
                            break;
                        case 52:
                            chr = '$';
                            break;
                        case 53:
                            chr = '%';
                            break;
                        case 54:
                            chr = '^';
                            break;
                        case 55:
                            chr = '&';
                            break;
                        case 56:
                            chr = '*';
                            break;
                        case 57:
                            chr = '(';
                            break;
                    }
                }
                else {
                    chr = String.fromCharCode(keyCode); // just the numbers 
                }
                _KernelInputQueue.enqueue(chr);
            }
            else if (keyCode == 32 || keyCode == 13) { // space or enter
                chr = String.fromCharCode(keyCode);
                _KernelInputQueue.enqueue(chr);
            }
            // backspace (delete)
            else if (keyCode === 8) {
                _KernelInputQueue.enqueue(String.fromCharCode(8));
            }
            // tab (for word completion)
            else if (keyCode === 9) {
                _KernelInputQueue.enqueue(String.fromCharCode(9));
            }
            // up arrow and down arrows
            else if (keyCode === 38 || keyCode === 40) {
                _KernelInputQueue.enqueue(keyCode);
            }
            // Handle special characters
            else {
                switch (keyCode) {
                    case 186: // semicolon
                        chr = isShifted ? ':' : ';';
                        break;
                    case 187: // equals
                        chr = isShifted ? '+' : '=';
                        break;
                    case 188: // comma
                        chr = isShifted ? '<' : ',';
                        break;
                    case 189: // dash
                        chr = isShifted ? '_' : '-';
                        break;
                    case 190: // period
                        chr = isShifted ? '>' : '.';
                        break;
                    case 191: // slash
                        chr = isShifted ? '?' : '/';
                        break;
                    case 219: // left bracket
                        chr = isShifted ? '{' : '[';
                        break;
                    case 220: // backslash
                        chr = isShifted ? '|' : '\\';
                        break;
                    case 221: // right bracket
                        chr = isShifted ? '}' : ']';
                        break;
                    case 222: // quote
                        chr = isShifted ? '"' : "'";
                        break;
                    default:
                        chr = ''; // Ignore other key codes
                        break;
                }
                if (chr) {
                    _KernelInputQueue.enqueue(chr);
                }
            }
        }
    }
    TSOS.DeviceDriverKeyboard = DeviceDriverKeyboard;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=deviceDriverKeyboard.js.map