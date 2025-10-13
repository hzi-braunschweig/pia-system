/*
 * SPDX-FileCopyrightText: 2004 Red Hat, Inc. and/or its affiliates and other contributors
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Copyright 2016 Red Hat, Inc. and/or its affiliates
 * and other contributors as indicated by the @author tags.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { checker } from 'vite-plugin-checker';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), checker({ typescript: true })],
  server: {
    origin: 'http://localhost:5173',
    port: 5173,
  },
  base: '',
  build: {
    manifest: true,
    sourcemap: true,
    rollupOptions: {
      input: 'src/main.tsx',
      external: ['react', 'react/jsx-runtime', 'react-dom'],
      treeshake: false,
    },
  },
});
