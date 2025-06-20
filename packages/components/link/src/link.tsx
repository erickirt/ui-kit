import type { LocationDescriptor } from 'history';
import type { Props as IntlMessage } from 'react-intl/src/components/message';
import {
  Children,
  type ReactNode,
  type MouseEvent,
  type KeyboardEvent,
} from 'react';
import styled from '@emotion/styled';
import { Link as ReactRouterLink } from 'react-router-dom';
import { css } from '@emotion/react';
import { FormattedMessage } from 'react-intl';
import { designTokens } from '@commercetools-uikit/design-system';
import { filterInvalidAttributes, warning } from '@commercetools-uikit/utils';
import { ExternalLinkIcon } from '@commercetools-uikit/icons';

export type TLinkProps = {
  /**
   * Value of the link.
   * <br />
   * Required if `intlMessage` is not provided.
   */
  children?: ReactNode;
  /**
   * An `intl` message object that will be rendered with `FormattedMessage`.
   * <br />
   * Required if `children` is not provided.
   */
  intlMessage?: IntlMessage;
  /**
   * A flag to indicate if the Link points to an external source.
   * <bt />
   * If `true`, a regular `<a>` is rendered instead of the default `react-router`s `<Link />`
   */
  isExternal?: boolean;
  /**
   * The URL that the Link should point to.
   */
  to: string | LocationDescriptor;
  /**
   * Color of the link
   */
  tone?: 'primary' | 'inverted' | 'secondary';

  /**
   * Handler when the link is clicked.
   */
  onClick?: (
    event: MouseEvent<HTMLLinkElement> | KeyboardEvent<HTMLLinkElement>
  ) => void;
};

const warnIfMissingContent = (props: TLinkProps) => {
  const hasContent =
    Boolean(props.intlMessage) || Boolean(Children.count(props.children));

  warning(
    hasContent,
    [
      'Warning: Failed prop type:',
      `The prop \`intlMessage\` is marked as required in \`Link\``,
      'but its value is `undefined`',
    ].join(' ')
  );
  warning(
    hasContent,
    [
      'Warning: Failed prop type:',
      `The prop \`children\` is marked as required in \`Link\``,
      'but its value is `undefined`',
    ].join(' ')
  );
};

const getTextColorValue = (tone: TLinkProps['tone'] = 'primary') => {
  if (tone === 'primary') {
    return designTokens.colorPrimary30;
  } else if (tone === 'secondary') {
    return designTokens.colorSolid;
  }

  return designTokens.colorSurface;
};

const getActiveColorValue = (tone: string = 'primary') => {
  if (tone === 'primary' || tone === 'secondary') {
    return designTokens.colorPrimary40;
  }

  return designTokens.colorSurface;
};

const getLinkStyles = (props: TLinkProps) => {
  const iconColor = getTextColorValue(props.tone);
  const iconHoverColor = getActiveColorValue(props.tone);

  return [
    css`
      font-family: inherit;
      color: ${iconColor};

      &:hover,
      &:focus,
      &:active {
        color: ${iconHoverColor};
      }
      text-decoration: underline;
    `,
  ];
};

const Wrapper = styled.span`
  > svg {
    margin: 0 0 0 ${designTokens.spacing10} !important;
    vertical-align: middle;
  }
`;

const Link = ({
  tone = 'primary',
  isExternal = false,
  ...props
}: TLinkProps) => {
  const allProps = { tone, isExternal, ...props };
  const remainingProps = filterInvalidAttributes(allProps);

  const color = getTextColorValue(tone);
  const hoverColor = getActiveColorValue(tone);

  // `filterInvalidAttributes` strips off `intlMessage` and `children`
  // so we pass in the "raw" props instead.
  warnIfMissingContent(allProps);

  if (isExternal) {
    if (typeof props.to !== 'string') {
      throw new Error('`to` must be a `string` when `isExternal` is provided.');
    }

    return (
      <Wrapper
        css={css`
          fill: ${color};
          &:hover {
            fill: ${hoverColor};
          }
        `}
      >
        <a
          css={getLinkStyles(allProps)}
          href={props.to}
          target="_blank"
          rel="noopener noreferrer"
          {...remainingProps}
        >
          {props.intlMessage ? (
            <FormattedMessage {...props.intlMessage} />
          ) : (
            props.children
          )}
        </a>
        {isExternal && <ExternalLinkIcon size="medium" />}
      </Wrapper>
    );
  }

  return (
    <ReactRouterLink
      css={getLinkStyles(allProps)}
      to={props.to}
      {...remainingProps}
    >
      {props.intlMessage ? (
        <FormattedMessage {...props.intlMessage} />
      ) : (
        props.children
      )}
    </ReactRouterLink>
  );
};

Link.displayName = 'Link';

export default Link;
