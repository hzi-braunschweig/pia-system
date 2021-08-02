"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseTextCompleter = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
class LicenseTextCompleter {
    static async init() {
        if (LicenseTextCompleter.initialize === null) {
            LicenseTextCompleter.initialize = LicenseTextCompleter.runInit();
        }
        return LicenseTextCompleter.initialize;
    }
    static has(packageName) {
        if (!LicenseTextCompleter.knownMissingLicenseTexts) {
            throw Error('LicenseTextCompleter was not initialized. Please call init().');
        }
        return LicenseTextCompleter.knownMissingLicenseTexts.has(packageName);
    }
    static get(packageName) {
        if (!LicenseTextCompleter.knownMissingLicenseTexts) {
            throw Error('LicenseTextCompleter was not initialized. Please call init().');
        }
        return LicenseTextCompleter.knownMissingLicenseTexts.get(packageName);
    }
    static async runInit() {
        await LicenseTextCompleter.fetchLicenses();
        LicenseTextCompleter.createLicenseMap();
    }
    static async fetchLicenses() {
        let i = 0;
        const fetchP = [];
        fetchP[i++] = node_fetch_1.default('https://www.apache.org/licenses/LICENSE-2.0.txt').then(async (res) => {
            LicenseTextCompleter.APACHE_LICENSE_2_0 = await res.text();
        });
        fetchP[i++] = node_fetch_1.default('https://www.gnu.org/licenses/gpl-2.0.txt').then(async (res) => {
            LicenseTextCompleter.GPL_2_0 = await res.text();
        });
        fetchP[i++] = node_fetch_1.default('https://www.gnu.org/licenses/gpl-3.0.txt').then(async (res) => {
            LicenseTextCompleter.GPL_3_0 = await res.text();
        });
        fetchP[i++] = node_fetch_1.default('https://www.gnu.org/licenses/lgpl-3.0.txt').then(async (res) => {
            LicenseTextCompleter.LGPL_3_0 = await res.text();
        });
        fetchP[i++] = node_fetch_1.default('https://raw.githubusercontent.com/angular/angular/master/LICENSE').then(async (res) => {
            LicenseTextCompleter.MIT_ANGULAR = await res.text();
        });
        fetchP[i++] = node_fetch_1.default('https://raw.githubusercontent.com/ionic-team/ionic-framework/main/LICENSE').then(async (res) => {
            LicenseTextCompleter.MIT_IONIC = await res.text();
        });
        fetchP[i++] = node_fetch_1.default('https://zenorocha.mit-license.org/license.txt').then(async (res) => {
            LicenseTextCompleter.MIT_ZENO_ROCHA = await res.text();
        });
        await Promise.all(fetchP);
    }
    static createLicenseMap() {
        LicenseTextCompleter.knownMissingLicenseTexts = new Map([
            ['@angular/animations', LicenseTextCompleter.MIT_ANGULAR],
            ['@angular/common', LicenseTextCompleter.MIT_ANGULAR],
            ['@angular/compiler', LicenseTextCompleter.MIT_ANGULAR],
            ['@angular/core', LicenseTextCompleter.MIT_ANGULAR],
            ['@angular/forms', LicenseTextCompleter.MIT_ANGULAR],
            ['@angular/localize', LicenseTextCompleter.MIT_ANGULAR],
            ['@angular/language-service', LicenseTextCompleter.MIT_ANGULAR],
            ['@angular/platform-browser-dynamic', LicenseTextCompleter.MIT_ANGULAR],
            ['@angular/platform-browser', LicenseTextCompleter.MIT_ANGULAR],
            ['@angular/router', LicenseTextCompleter.MIT_ANGULAR],
            ['@angular/compiler-cli', LicenseTextCompleter.MIT_ANGULAR],
            [
                '@babel/generator',
                'MIT License\n' +
                    '\n' +
                    'Copyright (c) 2014-present Sebastian McKenzie and other contributors\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining\n' +
                    'a copy of this software and associated documentation files (the\n' +
                    '"Software"), to deal in the Software without restriction, including\n' +
                    'without limitation the rights to use, copy, modify, merge, publish,\n' +
                    'distribute, sublicense, and/or sell copies of the Software, and to\n' +
                    'permit persons to whom the Software is furnished to do so, subject to\n' +
                    'the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be\n' +
                    'included in all copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,\n' +
                    'EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n' +
                    'MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND\n' +
                    'NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE\n' +
                    'LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION\n' +
                    'OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION\n' +
                    'WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
            ],
            ['@firebase/analytics-types', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/analytics', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/app-types', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/app', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/app-check', LicenseTextCompleter.APACHE_LICENSE_2_0],
            [
                '@firebase/app-check-interop-types',
                LicenseTextCompleter.APACHE_LICENSE_2_0,
            ],
            ['@firebase/app-check-types', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/auth-interop-types', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/auth-types', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/component', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/database-types', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/database', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/firestore-types', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/firestore', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/functions-types', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/functions', LicenseTextCompleter.APACHE_LICENSE_2_0],
            [
                '@firebase/installations-types',
                LicenseTextCompleter.APACHE_LICENSE_2_0,
            ],
            ['@firebase/installations', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/logger', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/messaging-types', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/messaging', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/performance-types', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/performance', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/polyfill', LicenseTextCompleter.APACHE_LICENSE_2_0],
            [
                '@firebase/remote-config-types',
                LicenseTextCompleter.APACHE_LICENSE_2_0,
            ],
            ['@firebase/remote-config', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/storage-types', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/storage', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/util', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@firebase/webchannel-wrapper', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['@ionic-native/core', LicenseTextCompleter.MIT_IONIC],
            ['@ionic-native/app-version', LicenseTextCompleter.MIT_IONIC],
            ['@ionic-native/barcode-scanner', LicenseTextCompleter.MIT_IONIC],
            ['@ionic-native/camera', LicenseTextCompleter.MIT_IONIC],
            ['@ionic-native/chooser', LicenseTextCompleter.MIT_IONIC],
            ['@ionic-native/file-opener', LicenseTextCompleter.MIT_IONIC],
            ['@ionic-native/file', LicenseTextCompleter.MIT_IONIC],
            ['@ionic-native/firebase-x', LicenseTextCompleter.MIT_IONIC],
            ['@ionic-native/keyboard', LicenseTextCompleter.MIT_IONIC],
            ['@ionic-native/network', LicenseTextCompleter.MIT_IONIC],
            ['@ionic-native/splash-screen', LicenseTextCompleter.MIT_IONIC],
            ['@ionic-native/status-bar', LicenseTextCompleter.MIT_IONIC],
            ['@ionic/angular', LicenseTextCompleter.MIT_IONIC],
            [
                '@types/cordova',
                'This project is licensed under the MIT license.\n' +
                    'Copyrights are respective of each contributor listed at the beginning of each definition file.\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
            ],
            [
                '@ngx-translate/core',
                'Copyright (c) 2018 Olivier Combe\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
            ],
            [
                '@ngx-translate/http-loader',
                'Copyright (c) 2018 Olivier Combe\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
            ],
            [
                'cliui',
                'Copyright (c) 2015, Contributors\n' +
                    '\n' +
                    'Permission to use, copy, modify, and/or distribute this software\n' +
                    'for any purpose with or without fee is hereby granted, provided\n' +
                    'that the above copyright notice and this permission notice\n' +
                    'appear in all copies.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES\n' +
                    'WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES\n' +
                    'OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE\n' +
                    'LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES\n' +
                    'OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,\n' +
                    'WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,\n' +
                    'ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.',
            ],
            [
                'cssstyle',
                'Copyright (c) Chad Walker\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining\n' +
                    'a copy of this software and associated documentation files (the\n' +
                    '"Software"), to deal in the Software without restriction, including\n' +
                    'without limitation the rights to use, copy, modify, merge, publish,\n' +
                    'distribute, sublicense, and/or sell copies of the Software, and to\n' +
                    'permit persons to whom the Software is furnished to do so, subject to\n' +
                    'the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be\n' +
                    'included in all copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,\n' +
                    'EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n' +
                    'MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND\n' +
                    'NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE\n' +
                    'LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION\n' +
                    'OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION\n' +
                    'WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
            ],
            [
                'cypress',
                'MIT License\n' +
                    '\n' +
                    'Copyright (c) 2021 Cypress.io\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining a copy\n' +
                    'of this software and associated documentation files (the "Software"), to deal\n' +
                    'in the Software without restriction, including without limitation the rights\n' +
                    'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n' +
                    'copies of the Software, and to permit persons to whom the Software is\n' +
                    'furnished to do so, subject to the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be included in all\n' +
                    'copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n' +
                    'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n' +
                    'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n' +
                    'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n' +
                    'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n' +
                    'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n' +
                    'SOFTWARE.',
            ],
            ['delegate', LicenseTextCompleter.MIT_ZENO_ROCHA],
            [
                'exit-hook',
                'MIT License\n' +
                    '\n' +
                    'Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
            ],
            ['firebase', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['good-listener', LicenseTextCompleter.MIT_ZENO_ROCHA],
            [
                'ngx-matomo-v9',
                'MIT License\n' +
                    '\n' +
                    'Copyright (c) 2018-2019 Arnaud Mouronval\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining a copy\n' +
                    'of this software and associated documentation files (the "Software"), to deal\n' +
                    'in the Software without restriction, including without limitation the rights\n' +
                    'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n' +
                    'copies of the Software, and to permit persons to whom the Software is\n' +
                    'furnished to do so, subject to the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be included in all\n' +
                    'copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n' +
                    'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n' +
                    'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n' +
                    'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n' +
                    'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n' +
                    'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n' +
                    'SOFTWARE.',
            ],
            ['select', LicenseTextCompleter.MIT_ZENO_ROCHA],
            [
                'throttleit',
                'Copyright Component\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
            ],
            [
                'tr46',
                '\n' +
                    '\n' +
                    'The MIT License (MIT)\n' +
                    '\n' +
                    'Copyright (c) 2016 Sebastian Mayr\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n',
            ],
            ['cordova-common', LicenseTextCompleter.APACHE_LICENSE_2_0],
            [
                'assert-plus',
                'The MIT License (MIT)\n' +
                    '\n' +
                    'Copyright (c) 2018, Joyent, Inc. and assert-plus authors\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining a copy of\n' +
                    'this software and associated documentation files (the "Software"), to deal in\n' +
                    'the Software without restriction, including without limitation the rights to\n' +
                    'use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\n' +
                    'the Software, and to permit persons to whom the Software is furnished to do so,\n' +
                    'subject to the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be included in all\n' +
                    'copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n' +
                    'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n' +
                    'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n' +
                    'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n' +
                    'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n' +
                    'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n' +
                    'SOFTWARE.',
            ],
            [
                'abbrev',
                'The ISC License\n' +
                    '\n' +
                    'Copyright (c) Isaac Z. Schlueter and Contributors\n' +
                    '\n' +
                    'Permission to use, copy, modify, and/or distribute this software for any\n' +
                    'purpose with or without fee is hereby granted, provided that the above\n' +
                    'copyright notice and this permission notice appear in all copies.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES\n' +
                    'WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF\n' +
                    'MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR\n' +
                    'ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES\n' +
                    'WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN\n' +
                    'ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR\n' +
                    'IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.',
            ],
            [
                'bplist-parser',
                '(The MIT License)\n' +
                    '\n' +
                    'Copyright (c) 2012 Near Infinity Corporation\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
            ],
            [
                'cookie-signature',
                '(The MIT License)\n' +
                    '\n' +
                    'Copyright (c) 2012–2019 LearnBoost <tj@learnboost.com> and other contributors;\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining\n' +
                    'a copy of this software and associated documentation files (the\n' +
                    "'Software'), to deal in the Software without restriction, including\n" +
                    'without limitation the rights to use, copy, modify, merge, publish,\n' +
                    'distribute, sublicense, and/or sell copies of the Software, and to\n' +
                    'permit persons to whom the Software is furnished to do so, subject to\n' +
                    'the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be\n' +
                    'included in all copies or substantial portions of the Software.\n' +
                    '\n' +
                    "THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,\n" +
                    'EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n' +
                    'MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.\n' +
                    'IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY\n' +
                    'CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,\n' +
                    'TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE\n' +
                    'SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
            ],
            [
                'date-fns',
                ' The MIT License (MIT)\n' +
                    '\n' +
                    'Copyright © 2021 Sasha Koss\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n',
            ],
            [
                'emoji-toolkit',
                'Copyright JoyPixels Inc\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n',
            ],
            [
                'isarray',
                'MIT License\n' +
                    '\n' +
                    'Copyright (c) 2013 Julian Gruber <julian@juliangruber.com>\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining a copy\n' +
                    'of this software and associated documentation files (the "Software"), to deal\n' +
                    'in the Software without restriction, including without limitation the rights\n' +
                    'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n' +
                    'copies of the Software, and to permit persons to whom the Software is\n' +
                    'furnished to do so, subject to the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be included in all\n' +
                    'copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n' +
                    'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n' +
                    'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n' +
                    'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n' +
                    'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n' +
                    'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n' +
                    'SOFTWARE.',
            ],
            [
                'jspdf',
                'Copyright\n' +
                    '(c) 2010-2020 James Hall, https://github.com/MrRio/jsPDF\n' +
                    '(c) 2015-2020 yWorks GmbH, https://www.yworks.com/\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining\n' +
                    'a copy of this software and associated documentation files (the\n' +
                    '"Software"), to deal in the Software without restriction, including\n' +
                    'without limitation the rights to use, copy, modify, merge, publish,\n' +
                    'distribute, sublicense, and/or sell copies of the Software, and to\n' +
                    'permit persons to whom the Software is furnished to do so, subject to\n' +
                    'the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be\n' +
                    'included in all copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,\n' +
                    'EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n' +
                    'MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND\n' +
                    'NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE\n' +
                    'LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION\n' +
                    'OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION\n' +
                    'WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
            ],
            [
                'json-schema',
                'BSD 3-Clause "New" License:\n' +
                    '**********************\n' +
                    '\n' +
                    'Copyright (c) 2005-2015, The Dojo Foundation\n' +
                    'All rights reserved.\n' +
                    '\n' +
                    'Redistribution and use in source and binary forms, with or without\n' +
                    'modification, are permitted provided that the following conditions are met:\n' +
                    '\n' +
                    '  * Redistributions of source code must retain the above copyright notice, this\n' +
                    '    list of conditions and the following disclaimer.\n' +
                    '  * Redistributions in binary form must reproduce the above copyright notice,\n' +
                    '    this list of conditions and the following disclaimer in the documentation\n' +
                    '    and/or other materials provided with the distribution.\n' +
                    '  * Neither the name of the Dojo Foundation nor the names of its contributors\n' +
                    '    may be used to endorse or promote products derived from this software\n' +
                    '    without specific prior written permission.\n' +
                    '\n' +
                    'THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND\n' +
                    'ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED\n' +
                    'WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE\n' +
                    'DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE\n' +
                    'FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL\n' +
                    'DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR\n' +
                    'SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER\n' +
                    'CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,\n' +
                    'OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE\n' +
                    'OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.',
            ],
            [
                'ospath',
                'Copyright JP Richardson\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
            ],
            [
                'stackblur',
                'StackBlur - a fast almost Gaussian Blur For Canvas\n' +
                    '\n' +
                    'Version: \t0.5\n' +
                    'Author:\t\tMario Klingemann\n' +
                    'Contact: \tmario@quasimondo.com\n' +
                    'Website:\thttp://www.quasimondo.com/StackBlurForCanvas\n' +
                    'Twitter:\t@quasimondo\n' +
                    '\n' +
                    'In case you find this class useful - especially in commercial projects -\n' +
                    'I am not totally unhappy for a small donation to my PayPal account\n' +
                    'mario@quasimondo.de\n' +
                    '\n' +
                    'Or support me on flattr: \n' +
                    'https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript\n' +
                    '\n' +
                    'Copyright (c) 2010 Mario Klingemann\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person\n' +
                    'obtaining a copy of this software and associated documentation\n' +
                    'files (the "Software"), to deal in the Software without\n' +
                    'restriction, including without limitation the rights to use,\n' +
                    'copy, modify, merge, publish, distribute, sublicense, and/or sell\n' +
                    'copies of the Software, and to permit persons to whom the\n' +
                    'Software is furnished to do so, subject to the following\n' +
                    'conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be\n' +
                    'included in all copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,\n' +
                    'EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES\n' +
                    'OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND\n' +
                    'NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT\n' +
                    'HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,\n' +
                    'WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING\n' +
                    'FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR\n' +
                    'OTHER DEALINGS IN THE SOFTWARE.',
            ],
            ['websocket-driver', LicenseTextCompleter.APACHE_LICENSE_2_0],
            ['websocket-extensions', LicenseTextCompleter.APACHE_LICENSE_2_0],
            [
                'xmldom',
                'Copyright 2019 - present Christopher J. Brody and other contributors, as listed in: https://github.com/xmldom/xmldom/graphs/contributors\n' +
                    'Copyright 2012 - 2017 @jindw <jindw@xidea.org> and other contributors, as listed in: https://github.com/jindw/xmldom/graphs/contributors\n' +
                    '\n' +
                    'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n' +
                    '\n' +
                    'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n' +
                    '\n' +
                    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
            ],
        ]);
    }
}
exports.LicenseTextCompleter = LicenseTextCompleter;
LicenseTextCompleter.initialize = null;
//# sourceMappingURL=licenseTextCompleter.js.map