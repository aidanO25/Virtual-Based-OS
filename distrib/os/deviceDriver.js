/* ------------------------------
     DeviceDriver.ts

     The "base class" for all Device Drivers.
     ------------------------------ */
var TSOS;
(function (TSOS) {
    class DeviceDriver {
        version = '0.07';
        status = 'unloaded';
        preemptable = false;
        driverEntry = null;
        isr = null;
    }
    TSOS.DeviceDriver = DeviceDriver;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=deviceDriver.js.map