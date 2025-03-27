from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.response import Response
from typing import Any, Optional, Union

def mistakes_were_made(
        exc: Exception,
        context: dict[str, Any]
    ) -> Optional[Response]:
    """
    When things go wrong, this function swoops in like a caffeinated superhero
    to save the day and make your errors look pretty.
    All error messages will be returned under the 'detail' key, because we're
    neat freaks like that.

    Note:
        This follows DRF's exception handler protocol:
        https://www.django-rest-framework.org/api-guide/exceptions/#custom-exception-handling
    """
    # First, get the standard error response
    response = exception_handler(exc, context)

    # If this is a Django validation error, convert it to DRF validation error
    if isinstance(exc, DjangoValidationError):
        exc = ValidationError(detail=exc.messages)
        response = exception_handler(exc, context)

    if response is not None and isinstance(exc, ValidationError):
        # For validation errors, structure them by field
        if isinstance(response.data, dict):
            messages = {}
            for field, errors in response.data.items():
                if isinstance(errors, list):
                    messages[field] = errors
                else:
                    messages[field] = [str(errors)]
            response.data = {'detail': messages}

    return response

def json_go_brrr(
        status: Union[int, None],
        message: Union[str,list[str],None] = None,
        data: Union[dict,None] = None):
    """
    The magical JSON formatter that makes your responses look so fresh and so clean.
    Like Marie Kondo, but for your API responses.

    Args:
        message: Words of wisdom to share with the world
        data: The precious payload that sparked joy
        status: HTTP status code (hopefully 200, but we're not judging)
    """
    response_data = {}

    if message:
        response_data['detail'] = message

    if data:
        response_data['data'] = data

    return Response(response_data, status=status)

messages = {
    "successful_id": "successfully found resource by given id",
    "err404": "cannot find resource with the given id/ resource does not exist",
    "unauth": "you must be logged in, in order to access",
    "forbidden": "this action is not allowed for the current user",
    "created": "successfully created new resource",
}
