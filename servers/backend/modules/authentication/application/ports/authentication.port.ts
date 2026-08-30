import { RegisterRequest } from "../dtos/requests/register.request";
import { RegisterResponse } from "../dtos/responses/register.response";

export interface AuthenticationUseCase {
  register(request: RegisterRequest): Promise<RegisterResponse>;
}
