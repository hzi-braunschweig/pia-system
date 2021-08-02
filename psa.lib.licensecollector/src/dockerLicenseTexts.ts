/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { LicenseTextCompleter } from './licenseTextCompleter';
import { PackageLicense } from './packageLicense';

export function getDockerLicenses(): PackageLicense[] {
  return [
    new PackageLicense(
      'node',
      'MIT',
      'The MIT License (MIT)\n' +
        '\n' +
        'Copyright (c) 2015 Joyent, Inc.\n' +
        'Copyright (c) 2015 Node.js contributors\n' +
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
        'SOFTWARE.'
    ),
    new PackageLicense(
      'nginx',
      'BSD-2-Clause',
      'Copyright (C) 2002-2021 Igor Sysoev\n' +
        'Copyright (C) 2011-2021 Nginx, Inc.\n' +
        'All rights reserved.\n' +
        '\n' +
        'Redistribution and use in source and binary forms, with or without\n' +
        'modification, are permitted provided that the following conditions\n' +
        'are met:\n' +
        '1. Redistributions of source code must retain the above copyright\n' +
        '   notice, this list of conditions and the following disclaimer.\n' +
        '2. Redistributions in binary form must reproduce the above copyright\n' +
        '   notice, this list of conditions and the following disclaimer in the\n' +
        '   documentation and/or other materials provided with the distribution.\n' +
        '\n' +
        "THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS ``AS IS'' AND\n" +
        'ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE\n' +
        'IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE\n' +
        'ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE\n' +
        'FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL\n' +
        'DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS\n' +
        'OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)\n' +
        'HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT\n' +
        'LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY\n' +
        'OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF\n' +
        'SUCH DAMAGE.'
    ),
    new PackageLicense(
      'postgres',
      'PostgreSQL',
      'PostgreSQL is released under the PostgreSQL License, a liberal Open Source license, similar to the BSD or MIT licenses.\n' +
        '\n' +
        'PostgreSQL Database Management System\n' +
        '(formerly known as Postgres, then as Postgres95)\n' +
        '\n' +
        'Portions Copyright © 1996-2021, The PostgreSQL Global Development Group\n' +
        '\n' +
        'Portions Copyright © 1994, The Regents of the University of California\n' +
        '\n' +
        'Permission to use, copy, modify, and distribute this software and its documentation for any purpose, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and this paragraph and the following two paragraphs appear in all copies.\n' +
        '\n' +
        'IN NO EVENT SHALL THE UNIVERSITY OF CALIFORNIA BE LIABLE TO ANY PARTY FOR DIRECT, INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOST PROFITS, ARISING OUT OF THE USE OF THIS SOFTWARE AND ITS DOCUMENTATION, EVEN IF THE UNIVERSITY OF CALIFORNIA HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n' +
        '\n' +
        'THE UNIVERSITY OF CALIFORNIA SPECIFICALLY DISCLAIMS ANY WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE SOFTWARE PROVIDED HEREUNDER IS ON AN "AS IS" BASIS, AND THE UNIVERSITY OF CALIFORNIA HAS NO OBLIGATIONS TO PROVIDE MAINTENANCE, SUPPORT, UPDATES, ENHANCEMENTS, OR MODIFICATIONS.'
    ),
    new PackageLicense('busybox', 'GPL-2.0', LicenseTextCompleter.GPL_2_0),
    new PackageLicense(
      'golang',
      'BSD-3-Clause',
      'Copyright (c) 2009 The Go Authors. All rights reserved.\n' +
        '\n' +
        'Redistribution and use in source and binary forms, with or without\n' +
        'modification, are permitted provided that the following conditions are\n' +
        'met:\n' +
        '\n' +
        '   * Redistributions of source code must retain the above copyright\n' +
        'notice, this list of conditions and the following disclaimer.\n' +
        '   * Redistributions in binary form must reproduce the above\n' +
        'copyright notice, this list of conditions and the following disclaimer\n' +
        'in the documentation and/or other materials provided with the\n' +
        'distribution.\n' +
        '   * Neither the name of Google Inc. nor the names of its\n' +
        'contributors may be used to endorse or promote products derived from\n' +
        'this software without specific prior written permission.\n' +
        '\n' +
        'THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS\n' +
        '"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT\n' +
        'LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR\n' +
        'A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT\n' +
        'OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,\n' +
        'SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\n' +
        'LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,\n' +
        'DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY\n' +
        'THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n' +
        '(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE\n' +
        'OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.'
    ),
    new PackageLicense(
      'mailhog/mailhog',
      'MIT',
      'The MIT License (MIT)\n' +
        '\n' +
        'Copyright (c) 2014 - 2016 Ian Kent\n' +
        '\n' +
        'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n' +
        '\n' +
        'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n' +
        '\n' +
        'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.'
    ),
    new PackageLicense(
      'rabbitmq',
      'MIT',
      'Copyright (c) 2014 Docker, Inc.\n' +
        '\n' +
        'Permission is hereby granted, free of charge, to any person obtaining\n' +
        'a copy of this software and associated documentation files (the\n' +
        '"Software"), to deal in the Software without restriction, including\n' +
        'without limitation the rights to use, copy, modify, merge, publish,\n' +
        'distribute, sublicense, and/or sell copies of the Software, and to\n' +
        'permit persons to whom the Software is furnished to do so, subject to\n' +
        'the following conditions:\n' +
        '\n' +
        'The above copyright notice and this permission notice shall be included\n' +
        'in all copies or substantial portions of the Software.\n' +
        '\n' +
        'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,\n' +
        'EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n' +
        'MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.\n' +
        'IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY\n' +
        'CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,\n' +
        'TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE\n' +
        'SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.'
    ),
    new PackageLicense(
      'atmoz/sftp',
      'MIT',
      'MIT License\n' +
        '\n' +
        'Copyright (c) Adrian Dvergsdal\n' +
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
        'SOFTWARE.'
    ),
    new PackageLicense(
      'alpine/git',
      'Apache-2.0',
      LicenseTextCompleter.APACHE_LICENSE_2_0
    ),
    new PackageLicense(
      'fsfe/reuse',
      ['GPL-3.0-or-later', 'Apache-2.0'],
      PackageLicense.EMPTY_LICENSE_TEXT_PLACEHOLDER
    ),
    new PackageLicense(
      'docker',
      'Apache-2.0',
      LicenseTextCompleter.APACHE_LICENSE_2_0
    ),
    new PackageLicense(
      'registry.gitlab.com/gitlab-org/release-cli',
      'MIT',
      'The MIT License (MIT)\n' +
        '\n' +
        'Copyright (c) 2015-present GitLab B.V.\n' +
        '\n' +
        'Permission is hereby granted, free of charge, to any person obtaining a copy\n' +
        'of this software and associated documentation files (the "Software"), to deal\n' +
        'in the Software without restriction, including without limitation the rights\n' +
        'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n' +
        'copies of the Software, and to permit persons to whom the Software is\n' +
        'furnished to do so, subject to the following conditions:\n' +
        '\n' +
        'The above copyright notice and this permission notice shall be included in\n' +
        'all copies or substantial portions of the Software.\n' +
        '\n' +
        'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n' +
        'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n' +
        'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n' +
        'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n' +
        'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n' +
        'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n' +
        'THE SOFTWARE.\n'
    ),
    new PackageLicense(
      'registry.gitlab.com/gitlab-org/security-products/analyzers/secrets',
      'MIT',
      'Copyright GitLab B.V.\n' +
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
        'SOFTWARE.\n'
    ),
    new PackageLicense(
      'alpine',
      'MIT',
      '\n' +
        'MIT License\n' +
        '\n' +
        'Copyright (c) 2019 Natanael Copa\n' +
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
        'SOFTWARE.'
    ),
    new PackageLicense(
      'cypress/included',
      'MIT',
      'The MIT License (MIT)\n' +
        '\n' +
        'Copyright (c) 2019 Cypress.io, LLC\n' +
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
        'SOFTWARE.'
    ),
    new PackageLicense(
      'fluent/fluentd',
      'Apache-2.0',
      LicenseTextCompleter.APACHE_LICENSE_2_0
    ),
    new PackageLicense(
      'sonarsource/sonar-scanner-cli',
      'LGPL-3.0',
      LicenseTextCompleter.LGPL_3_0
    ),
    new PackageLicense('bash', 'GPL-3.0', LicenseTextCompleter.GPL_3_0),
    new PackageLicense(
      'curlimages/curl',
      'MIT',
      'MIT License\n' +
        '\n' +
        'curl-docker Copyright (c) 2020 James Fuller (jim.fuller@webcomposite.com)\n' +
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
        'SOFTWARE.'
    ),
  ];
}
