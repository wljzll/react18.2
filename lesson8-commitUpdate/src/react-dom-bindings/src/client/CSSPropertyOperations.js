






export function setValueForStyles(node, styles) {
    const { style } = node;
    // styles = {color: 'red' }
    for (const styleName in styles) {
        if (Object.hasOwnProperty.call(styles, styleName)) {
            const styleValue = styles[styleName];
            style[styleName] = styleValue;

        }
    }
}