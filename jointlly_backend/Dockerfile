# Use AWS Lambda Python base image
FROM public.ecr.aws/lambda/python:3.11

# Set working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy requirements first (better caching)
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy entire backend code
COPY app ${LAMBDA_TASK_ROOT}/app

# Set Lambda handler
CMD ["app.main.handler"]







