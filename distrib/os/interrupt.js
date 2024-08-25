/* ------------
   Interrupt.ts
   ------------ */
var TSOS;
(function (TSOS) {
    class Interrupt {
        irq;
        params;
        constructor(irq, params) {
            this.irq = irq;
            this.params = params;
        }
    }
    TSOS.Interrupt = Interrupt;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=interrupt.js.map