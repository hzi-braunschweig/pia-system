/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export enum CameraResultType {
  Base64 = 'base64',
  DataUrl = 'dataUrl',
}

export interface ImageOptions {
  quality?: number;
  allowEditing?: boolean;
  resultType?: CameraResultType;
  saveToGallery?: boolean;
  width?: number;
  height?: number;
  correctOrientation?: boolean;
  source?: CameraSource;
}

export interface Photo {
  base64String?: string;
  format: string;
  saved: boolean;
}

export const Camera = {
  async getPhoto(options: ImageOptions): Promise<Photo> {
    return {
      base64String: 'mock_base64_string',
      format: 'jpeg',
      saved: false,
    };
  },
  async checkPermissions(): Promise<PermissionStatus> {
    return { camera: 'granted' };
  },
  async requestPermissions(): Promise<PermissionStatus> {
    return { camera: 'granted' };
  },
};

export enum CameraSource {
  Prompt = 'PROMPT',
  Camera = 'CAMERA',
  Photos = 'PHOTOS',
}

interface PermissionStatus {
  camera: PermissionState;
}

type PermissionState =
  | 'prompt'
  | 'prompt-with-rationale'
  | 'granted'
  | 'denied';
