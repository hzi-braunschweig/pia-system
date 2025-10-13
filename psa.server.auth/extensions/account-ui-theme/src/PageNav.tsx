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
 *
 * ---
 *
 * This file has been modified:
 *   - added onClick handler to toggle the sidenav (did not work by default)
 */

import {
  Nav,
  NavItem,
  NavItemProps,
  NavList,
  PageSidebar,
  PageSidebarBody,
} from '@patternfly/react-core';
import {
  PropsWithChildren,
  MouseEvent as ReactMouseEvent,
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useHref, useLinkClickHandler } from 'react-router-dom';
import { routes } from './routes';
import { environment } from './environment';

export const PageNav = () => {
  const { t } = useTranslation();
  const [active, setActive] = useState<string | undefined>();

  const getInitialValueForIsOpen = () => {
    return window.innerWidth >= 1200;
  };
  const [isOpen, setIsOpen] = useState<boolean>(getInitialValueForIsOpen);

  // needed because the usual way of using isManagedSidebar on Page (in App.tsx) does not work in the keycloak component
  useEffect(() => {
    const externalButton = document.getElementById('nav-toggle');
    if (externalButton) {
      const handleClick = () => {
        setIsOpen((value) => !value);
      };

      externalButton.addEventListener('click', handleClick);

      return () => {
        externalButton.removeEventListener('click', handleClick);
      };
    }
  }, []);

  return (
    <PageSidebar isSidebarOpen={isOpen}>
      <PageSidebarBody>
        <Nav>
          <NavList>
            {routes[0].children
              ?.map((r) => r.path)
              .filter((path) => path)
              .map((path) => (
                <NavLink
                  key={path}
                  path={path!}
                  isActive={
                    path === window.location.pathname || path === active
                  }
                  onClick={() => setActive(path)}
                >
                  {t(path!.substring(path!.lastIndexOf('/') + 1, path!.length))}
                </NavLink>
              ))}
          </NavList>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
};

type NavLinkProps = NavItemProps & {
  path: string;
};

function getFullUrl(path: string) {
  return `${new URL(environment.baseUrl).pathname}${path}`;
}

export const NavLink = ({
  path,
  isActive,
  children,
}: PropsWithChildren<NavLinkProps>) => {
  const menuItemPath = getFullUrl(path) + location.search;
  const href = useHref(menuItemPath);
  const handleClick = useLinkClickHandler(menuItemPath);

  return (
    <NavItem
      data-testid={path}
      to={href}
      isActive={isActive}
      onClick={(event) =>
        // PatternFly does not have the correct type for this event, so we need to cast it.
        handleClick(event as unknown as ReactMouseEvent<HTMLAnchorElement>)
      }
    >
      {children}
    </NavItem>
  );
};
