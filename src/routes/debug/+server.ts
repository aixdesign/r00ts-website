export function GET({ request, getClientAddress }) {
    return Response.json({
        clientAddress: getClientAddress(),
        headers: Object.fromEntries(request.headers)
    });
}
