const drawRoundedRectangle = (ctx, x, y, width, height, radius) => {
    ctx.arc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2);
    ctx.arc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI);
    ctx.arc(x + radius, y + radius, radius, Math.PI, Math.PI * (3 / 2));
    ctx.arc(x + width - radius, y + radius, radius, Math.PI * (3 / 2), 2 * Math.PI);
}
